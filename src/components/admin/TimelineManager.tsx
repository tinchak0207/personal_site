import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { TimelineEvent } from '../../types';
import { NodeSelector } from './NodeSelector';

export function TimelineManager({ setLoading, setErrorMsg }: { setLoading: (l: boolean) => void, setErrorMsg: (m: string) => void }) {
  const [timeline_events, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [editingTimelineEvent, setEditingTimelineEvent] = useState<Partial<TimelineEvent> | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<string[]>(['/']);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const markdownFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTimelineEvents();
  }, []);

  const fetchTimelineEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('timeline_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) setErrorMsg(error.message);
    else if (data) setTimelineEvents(data);
    setLoading(false);
  };

  const handleImageUpload = async (file: File, isMarkdown: boolean = false) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload an image file.');
      return;
    }

    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `timeline/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('images').getPublicUrl(filePath);

      if (data?.publicUrl) {
        if (isMarkdown) {
          insertMarkdown(`![${file.name}](${data.publicUrl})`, '');
        } else {
          setEditingTimelineEvent(prev => prev ? { ...prev, image_url: data.publicUrl } : null);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Image upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          handleImageUpload(file, true);
          break;
        }
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file, true);
    }
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const value = e.currentTarget.value.trim();
      if (value && editingTimelineEvent) {
        const currentTags = editingTimelineEvent.tags || [];
        if (!currentTags.includes(value)) {
          setEditingTimelineEvent({ ...editingTimelineEvent, tags: [...currentTags, value] });
        }
        e.currentTarget.value = '';
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    if (editingTimelineEvent) {
      setEditingTimelineEvent({
        ...editingTimelineEvent,
        tags: (editingTimelineEvent.tags || []).filter((tag: string) => tag !== tagToRemove)
      });
    }
  };

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('event-description-editor') as HTMLTextAreaElement;
    if (!textarea || !editingTimelineEvent) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = editingTimelineEvent.description || '';
    const selectedText = text.substring(start, end);

    const newText = text.substring(0, start) + prefix + selectedText + suffix + text.substring(end);
    setEditingTimelineEvent({ ...editingTimelineEvent, description: newText });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const handleSaveTimelineEvent = async (e?: React.FormEvent, isAutoSave = false) => {
    if (e) e.preventDefault();
    if (!editingTimelineEvent || !editingTimelineEvent.title || !editingTimelineEvent.description) {
      if (!isAutoSave) setErrorMsg('Title and description are required');
      return;
    }
    
    if (!isAutoSave) setLoading(true);
    setSaveStatus('saving');

    const eventData = {
      title: editingTimelineEvent.title,
      description: editingTimelineEvent.description,
      date: editingTimelineEvent.date || new Date().toISOString().split('T')[0],
      link: editingTimelineEvent.link || null,
      image_url: editingTimelineEvent.image_url || null,
      published: editingTimelineEvent.published || false,
      tags: editingTimelineEvent.tags || [],
      folder: editingTimelineEvent.folder?.trim() || '/',
    };

    if (editingTimelineEvent.id) {
      const { error } = await supabase
        .from('timeline_events')
        .update({ ...eventData, updated_at: new Date().toISOString() })
        .eq('id', editingTimelineEvent.id);
        
      if (error) {
        if (!isAutoSave) setErrorMsg(error.message);
        setSaveStatus('error');
      } else {
        if (!isAutoSave) fetchTimelineEvents();
        else {
          setTimelineEvents(prev => prev.map(p => p.id === editingTimelineEvent.id ? { ...p, ...eventData, updated_at: new Date().toISOString() } as TimelineEvent : p));
        }
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    } else {
      if (isAutoSave) {
        setSaveStatus('idle');
        return;
      }
      const { data, error } = await supabase.from('timeline_events').insert([eventData]).select();
      if (error) {
        setErrorMsg(error.message);
        setSaveStatus('error');
      } else if (data && data.length > 0) {
        setEditingTimelineEvent(data[0]);
        fetchTimelineEvents();
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    }
    if (!isAutoSave) setLoading(false);
  };

  // Auto-save effect
  useEffect(() => {
    if (!editingTimelineEvent || !editingTimelineEvent.id) return;
    const timer = setTimeout(() => {
      handleSaveTimelineEvent(undefined, true);
    }, 1500);
    return () => clearTimeout(timer);
  }, [editingTimelineEvent]);

  const handleDeleteTimelineEvent = async () => {
    if (!editingTimelineEvent?.id) return;
    if (!window.confirm('Delete this event permanently?')) return;
    
    setLoading(true);
    const { error } = await supabase.from('timeline_events').delete().eq('id', editingTimelineEvent.id);
    if (error) setErrorMsg(error.message);
    else {
      setEditingTimelineEvent(null);
      fetchTimelineEvents();
    }
    setLoading(false);
  };

  // Group timeline_events by folder
  const timeline_eventsByFolder = useMemo(() => {
    return timeline_events.reduce((acc, event) => {
      const f = event.folder || '/';
      if (!acc[f]) acc[f] = [];
      acc[f].push(event);
      return acc;
    }, {} as Record<string, TimelineEvent[]>);
  }, [timeline_events]);

  const toggleFolder = (folder: string) => {
    if (expandedFolders.includes(folder)) {
      setExpandedFolders(expandedFolders.filter(f => f !== folder));
    } else {
      setExpandedFolders([...expandedFolders, folder]);
    }
  };

  const createNewTimelineEvent = (folder: string = '/') => {
    setEditingTimelineEvent({ title: '', description: '', date: new Date().toISOString().split('T')[0], published: false, folder, tags: [] });
  };

  return (
    <div className="flex h-[calc(100vh-150px)] border border-[#1B3B2B] bg-[#0a140f]/50">
      {/* File Explorer Sidebar (Obsidian Style) */}
      <div className="w-64 border-r border-[#1B3B2B] flex flex-col bg-[#030a07] shrink-0">
        <div className="p-3 border-b border-[#1B3B2B] flex justify-between items-center shrink-0">
          <span className="font-pixel text-xs tracking-widest text-[#4a6b57]">EXPLORER</span>
          <div className="flex gap-2">
            <button onClick={() => createNewTimelineEvent('/')} className="text-[#A5D6B7] hover:text-[#4ADE80] transition-colors" title="New TimelineEvent">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
            </button>
            <button onClick={() => {
              const newFolder = window.prompt('Enter new folder path (e.g. "Web3/DeFi"):');
              if (newFolder) createNewTimelineEvent(newFolder);
            }} className="text-[#A5D6B7] hover:text-[#4ADE80] transition-colors" title="New Folder">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 font-mono text-sm">
          {Object.keys(timeline_eventsByFolder).sort().map(folder => {
            const isExpanded = expandedFolders.includes(folder);
            return (
              <div key={folder} className="mb-1">
                <div 
                  className="flex items-center gap-2 px-2 py-1 cursor-pointer text-[#8FBC8F] hover:bg-[#1B3B2B] hover:text-[#4ADE80] rounded group transition-colors"
                  onClick={() => toggleFolder(folder)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                  <span className="truncate">{folder === '/' ? 'Root' : folder}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); createNewTimelineEvent(folder); }} 
                    className="ml-auto opacity-0 group-hover:opacity-100 hover:text-[#E8F5E9]"
                  >
                    +
                  </button>
                </div>
                
                {isExpanded && (
                  <div className="ml-4 pl-2 border-l border-[#1B3B2B]">
                    {timeline_eventsByFolder[folder].map(event => (
                      <div 
                        key={event.id}
                        onClick={() => setEditingTimelineEvent(event)}
                        className={`truncate px-2 py-1 my-0.5 cursor-pointer rounded transition-colors text-xs ${editingTimelineEvent?.id === event.id ? 'bg-[#1B3B2B] text-[#4ADE80] font-bold' : 'text-[#4a6b57] hover:bg-[#0a140f] hover:text-[#A5D6B7]'}`}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#030a07]">
        {editingTimelineEvent ? (
          <form onSubmit={handleSaveTimelineEvent} className="flex flex-col h-full">
            {/* Editor Header */}
            <div className="flex justify-between items-center border-b border-[#1B3B2B] p-3 shrink-0 bg-[#0a140f]">
              <div className="flex items-center gap-2 w-1/2">
                <input 
                  type="text" 
                  value={editingTimelineEvent.folder || ''}
                  onChange={(e) => setEditingTimelineEvent({...editingTimelineEvent, folder: e.target.value})}
                  className="bg-transparent border-none text-[#4a6b57] text-sm font-mono outline-none placeholder-[#4a6b57]/50 w-24 text-right shrink-0"
                  placeholder="/"
                />
                <span className="text-[#4a6b57]">/</span>
                <input 
                  type="text" 
                  value={editingTimelineEvent.title || ''}
                  onChange={(e) => setEditingTimelineEvent({...editingTimelineEvent, title: e.target.value})}
                  className="bg-transparent border-none text-[#E8F5E9] text-xl font-pixel outline-none placeholder-[#4a6b57]/50 flex-1 min-w-0"
                  placeholder="Untitled TimelineEvent"
                  required
                />
              </div>
              <div className="flex items-center gap-4 shrink-0">
                {saveStatus === 'saving' && <span className="text-[#81D4FA] font-pixel text-[10px] animate-pulse tracking-widest">SAVING...</span>}
                {saveStatus === 'saved' && <span className="text-[#4ADE80] font-pixel text-[10px] tracking-widest">SAVED</span>}
                {saveStatus === 'error' && <span className="text-red-400 font-pixel text-[10px] tracking-widest">ERROR</span>}
                <label className="flex items-center gap-2 cursor-pointer text-[#A5D6B7] hover:text-[#4ADE80] transition-colors font-pixel text-xs">
                  <input 
                    type="checkbox" 
                    checked={editingTimelineEvent.published || false}
                    onChange={(e) => setEditingTimelineEvent({...editingTimelineEvent, published: e.target.checked})}
                    className="w-3 h-3 accent-[#4ADE80] bg-[#0a140f] border-[#1B3B2B]"
                  />
                  PUBLISH
                </label>
                <button type="submit" className="text-[#4ADE80] hover:text-[#E8F5E9] font-pixel text-sm transition-colors">SAVE</button>
                {editingTimelineEvent.id && (
                  <button type="button" onClick={handleDeleteTimelineEvent} className="text-red-900 hover:text-red-400 font-pixel text-sm transition-colors">DEL</button>
                )}
              </div>
            </div>

            <div className="flex flex-1 min-h-0 relative">
              {/* Markdown Editor */}
              <div className="flex-1 flex flex-col min-w-0">
                <div className="p-4 border-b border-[#1B3B2B] bg-[#0a140f]/50 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-pixel text-[10px] tracking-widest text-[#4a6b57] mb-2">DATE</label>
                    <input
                      type="date"
                      value={editingTimelineEvent.date || ''}
                      onChange={(e) => setEditingTimelineEvent({...editingTimelineEvent, date: e.target.value})}
                      className="w-full bg-[#030a07] border border-[#1B3B2B] focus:border-[#4ADE80] text-[#A5D6B7] p-2 outline-none font-mono text-sm placeholder-[#4a6b57]/50 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-pixel text-[10px] tracking-widest text-[#4a6b57] mb-2">LINK (Optional)</label>
                    <input
                      type="text"
                      value={editingTimelineEvent.link || ''}
                      onChange={(e) => setEditingTimelineEvent({...editingTimelineEvent, link: e.target.value})}
                      className="w-full bg-[#030a07] border border-[#1B3B2B] focus:border-[#4ADE80] text-[#A5D6B7] p-2 outline-none font-mono text-sm placeholder-[#4a6b57]/50 transition-colors"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block font-pixel text-[10px] tracking-widest text-[#4a6b57] mb-2">IMAGE URL (Optional)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editingTimelineEvent.image_url || ''}
                        onChange={(e) => setEditingTimelineEvent({...editingTimelineEvent, image_url: e.target.value})}
                        className="flex-1 bg-[#030a07] border border-[#1B3B2B] focus:border-[#4ADE80] text-[#A5D6B7] p-2 outline-none font-mono text-sm placeholder-[#4a6b57]/50 transition-colors min-w-0"
                        placeholder="https://..."
                      />
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], false)} />
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 py-2 bg-[#1B3B2B] text-[#A5D6B7] hover:bg-[#4ADE80] hover:text-[#030a07] font-pixel text-xs transition-colors shrink-0">
                        UPLOAD
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 p-2 bg-[#0a140f] border-b border-[#1B3B2B] shrink-0">
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertMarkdown('**', '**')} className="px-2 py-1 text-[#A5D6B7] font-mono text-xs hover:bg-[#1B3B2B] hover:text-[#4ADE80] transition-colors rounded" title="Bold">B</button>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertMarkdown('*', '*')} className="px-2 py-1 text-[#A5D6B7] font-mono text-xs hover:bg-[#1B3B2B] hover:text-[#4ADE80] transition-colors italic rounded" title="Italic">I</button>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertMarkdown('### ', '')} className="px-2 py-1 text-[#A5D6B7] font-mono text-xs hover:bg-[#1B3B2B] hover:text-[#4ADE80] transition-colors font-bold rounded" title="Heading">H</button>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertMarkdown('[', '](url)')} className="px-2 py-1 text-[#A5D6B7] font-mono text-xs hover:bg-[#1B3B2B] hover:text-[#4ADE80] transition-colors rounded" title="Link">L</button>
                  
                  <input type="file" ref={markdownFileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], true)} />
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => markdownFileInputRef.current?.click()} className="px-2 py-1 text-[#A5D6B7] font-mono text-xs hover:bg-[#1B3B2B] hover:text-[#4ADE80] transition-colors rounded flex items-center gap-1" title="Upload Image">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                    IMG
                  </button>

                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertMarkdown('```\n', '\n```')} className="px-2 py-1 text-[#A5D6B7] font-mono text-xs hover:bg-[#1B3B2B] hover:text-[#4ADE80] transition-colors rounded" title="Code Block">{'<>'}</button>
                </div>
                <textarea
                  id="event-description-editor"
                  value={editingTimelineEvent.description || ''}
                  onChange={(e) => setEditingTimelineEvent({...editingTimelineEvent, description: e.target.value})}
                  onPaste={handlePaste}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="flex-1 w-full bg-transparent border-none text-[#A5D6B7] p-6 font-mono outline-none resize-none placeholder-[#4a6b57]/30 custom-scrollbar leading-relaxed"
                  placeholder="TimelineEvent description (Markdown supported)... You can also drag & drop or paste images here."
                  required
                />
              </div>

              {/* Properties Sidebar (Right) */}
              <div className="w-56 shrink-0 border-l border-[#1B3B2B] bg-[#0a140f] p-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                <div>
                  <label className="block font-pixel text-[10px] tracking-widest text-[#4a6b57] mb-2">CUSTOM TAGS</label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(editingTimelineEvent.tags || []).map((tag: string) => (
                      <span key={tag} className="flex items-center gap-1 bg-[#1B3B2B] text-[#4ADE80] px-1.5 py-0.5 text-[10px] font-pixel border border-[#4a6b57] hover:border-red-900 transition-colors group cursor-pointer" onClick={() => removeTag(tag)}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <input 
                    type="text" 
                    onKeyDown={handleTagInput}
                    className="w-full bg-[#030a07] border border-[#1B3B2B] focus:border-[#4ADE80] text-[#E8F5E9] p-1.5 outline-none font-pixel text-[10px] placeholder-[#4a6b57]/50 transition-colors"
                    placeholder="Add tag..."
                  />
                </div>
                
                <div>
                  <label className="block font-pixel text-[10px] tracking-widest text-[#4a6b57] mb-2">NODE SELECTOR</label>
                  <NodeSelector 
                    selectedTags={editingTimelineEvent.tags || []} 
                    onAddTag={(tag) => {
                      const currentTags = editingTimelineEvent.tags || [];
                      if (!currentTags.includes(tag)) setEditingTimelineEvent({ ...editingTimelineEvent, tags: [...currentTags, tag] });
                    }}
                    onRemoveTag={removeTag}
                  />
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[#4a6b57] font-pixel tracking-widest">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
              <p>NO PROJECT SELECTED</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
