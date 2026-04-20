import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { Post } from '../../types';
import { NodeSelector } from './NodeSelector';
import { MarkdownEditor } from './MarkdownEditor';

export function RamblingsManager({ setLoading, setErrorMsg }: { setLoading: (l: boolean) => void, setErrorMsg: (m: string) => void }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [editingPost, setEditingPost] = useState<Partial<Post> | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<string[]>(['/']);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) setErrorMsg(error.message);
    else if (data) setPosts(data);
    setLoading(false);
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const value = e.currentTarget.value.trim();
      if (value && editingPost) {
        const currentTags = editingPost.tags || [];
        if (!currentTags.includes(value)) {
          setEditingPost({ ...editingPost, tags: [...currentTags, value] });
        }
        e.currentTarget.value = '';
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    if (editingPost) {
      setEditingPost({
        ...editingPost,
        tags: (editingPost.tags || []).filter((tag: string) => tag !== tagToRemove)
      });
    }
  };

  const handleSavePost = async (e?: React.FormEvent, isAutoSave = false) => {
    if (e) e.preventDefault();
    if (!editingPost || !editingPost.title) {
      if (!isAutoSave) setErrorMsg('Title is required');
      return;
    }
    
    const finalSlug = editingPost.slug || editingPost.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const finalFolder = editingPost.folder?.trim() || '/';

    if (!isAutoSave) setLoading(true);
    setSaveStatus('saving');
    
    const postData = {
      title: editingPost.title,
      slug: finalSlug,
      content: editingPost.content,
      published: editingPost.published,
      tags: editingPost.tags || [],
      folder: finalFolder,
    };

    if (editingPost.id) {
      const { error } = await supabase
        .from('posts')
        .update({ ...postData, updated_at: new Date().toISOString() })
        .eq('id', editingPost.id);
        
      if (error) {
        if (!isAutoSave) setErrorMsg(error.message);
        setSaveStatus('error');
      } else {
        if (!isAutoSave) fetchPosts();
        else {
          setPosts(prev => prev.map(p => p.id === editingPost.id ? { ...p, ...postData, updated_at: new Date().toISOString() } as Post : p));
        }
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    } else {
      if (isAutoSave) {
        setSaveStatus('idle');
        return; // Do not auto-save a brand new post without ID
      }
      const { data, error } = await supabase.from('posts').insert([postData]).select();
      if (error) {
        setErrorMsg(error.message);
        setSaveStatus('error');
      } else if (data && data.length > 0) {
        setEditingPost(data[0]);
        fetchPosts();
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    }
    if (!isAutoSave) setLoading(false);
  };

  // Auto-save effect
  useEffect(() => {
    if (!editingPost || !editingPost.id) return;
    const timer = setTimeout(() => {
      handleSavePost(undefined, true);
    }, 1500);
    return () => clearTimeout(timer);
  }, [editingPost]);

  const handleDeletePost = async () => {
    if (!editingPost?.id) return;
    if (!window.confirm('Delete this log permanently?')) return;
    
    setLoading(true);
    const { error } = await supabase.from('posts').delete().eq('id', editingPost.id);
    if (error) setErrorMsg(error.message);
    else {
      setEditingPost(null);
      fetchPosts();
    }
    setLoading(false);
  };

  // Group posts by folder
  const postsByFolder = useMemo(() => {
    return posts.reduce((acc, post) => {
      const f = post.folder || '/';
      if (!acc[f]) acc[f] = [];
      acc[f].push(post);
      return acc;
    }, {} as Record<string, Post[]>);
  }, [posts]);

  const toggleFolder = (folder: string) => {
    if (expandedFolders.includes(folder)) {
      setExpandedFolders(expandedFolders.filter(f => f !== folder));
    } else {
      setExpandedFolders([...expandedFolders, folder]);
    }
  };

  const createNewPost = (folder: string = '/') => {
    setEditingPost({ title: '', slug: '', content: '', published: false, folder, tags: [] });
  };

  return (
    <div className="flex h-[calc(100vh-150px)] border border-[#1B3B2B] bg-[#0a140f]/50">
      
      {/* File Explorer Sidebar (Obsidian Style) */}
      <div className="w-64 border-r border-[#1B3B2B] flex flex-col bg-[#030a07] shrink-0">
        <div className="p-3 border-b border-[#1B3B2B] flex justify-between items-center shrink-0">
          <span className="font-pixel text-xs tracking-widest text-[#4a6b57]">EXPLORER</span>
          <div className="flex gap-2">
            <button onClick={() => createNewPost('/')} className="text-[#A5D6B7] hover:text-[#4ADE80] transition-colors" title="New Note">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
            </button>
            <button onClick={() => {
              const newFolder = window.prompt('Enter new folder path (e.g. "AI/DL"):');
              if (newFolder) createNewPost(newFolder);
            }} className="text-[#A5D6B7] hover:text-[#4ADE80] transition-colors" title="New Folder">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 font-mono text-sm">
          {Object.keys(postsByFolder).sort().map(folder => {
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
                    onClick={(e) => { e.stopPropagation(); createNewPost(folder); }} 
                    className="ml-auto opacity-0 group-hover:opacity-100 hover:text-[#E8F5E9]"
                  >
                    +
                  </button>
                </div>
                
                {isExpanded && (
                  <div className="ml-4 pl-2 border-l border-[#1B3B2B]">
                    {postsByFolder[folder].map(post => (
                      <div 
                        key={post.id}
                        onClick={() => setEditingPost(post)}
                        className={`truncate px-2 py-1 my-0.5 cursor-pointer rounded transition-colors text-xs ${editingPost?.id === post.id ? 'bg-[#1B3B2B] text-[#4ADE80] font-bold' : 'text-[#4a6b57] hover:bg-[#0a140f] hover:text-[#A5D6B7]'}`}
                      >
                        {post.title}
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
        {editingPost ? (
          <form onSubmit={handleSavePost} className="flex flex-col h-full">
            {/* Editor Header */}
            <div className="flex justify-between items-center border-b border-[#1B3B2B] p-3 shrink-0 bg-[#0a140f]">
              <div className="flex items-center gap-2 w-1/2">
                <input 
                  type="text" 
                  value={editingPost.folder || ''}
                  onChange={(e) => setEditingPost({...editingPost, folder: e.target.value})}
                  className="bg-transparent border-none text-[#4a6b57] text-sm font-mono outline-none placeholder-[#4a6b57]/50 w-24 text-right shrink-0"
                  placeholder="/"
                />
                <span className="text-[#4a6b57]">/</span>
                <input 
                  type="text" 
                  value={editingPost.title || ''}
                  onChange={(e) => setEditingPost({...editingPost, title: e.target.value})}
                  className="bg-transparent border-none text-[#E8F5E9] text-xl font-pixel outline-none placeholder-[#4a6b57]/50 flex-1 min-w-0"
                  placeholder="Untitled Log"
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
                    checked={editingPost.published || false}
                    onChange={(e) => setEditingPost({...editingPost, published: e.target.checked})}
                    className="w-3 h-3 accent-[#4ADE80] bg-[#0a140f] border-[#1B3B2B]"
                  />
                  PUBLISH
                </label>
                <button type="submit" className="text-[#4ADE80] hover:text-[#E8F5E9] font-pixel text-sm transition-colors">SAVE</button>
                {editingPost.id && (
                  <button type="button" onClick={handleDeletePost} className="text-red-900 hover:text-red-400 font-pixel text-sm transition-colors">DEL</button>
                )}
              </div>
            </div>

            <div className="flex flex-1 min-h-0 relative">
              {/* Markdown Editor */}
              <div className="flex-1 flex flex-col min-w-0">
                <MarkdownEditor
                  id="markdown-editor"
                  value={editingPost.content || ''}
                  onChange={(val) => setEditingPost({...editingPost, content: val})}
                  setLoading={setLoading}
                  setErrorMsg={setErrorMsg}
                  placeholder="Start typing... (Paste or drag images to upload)"
                  required={true}
                />
              </div>

              {/* Properties Sidebar (Right) */}
              <div className="w-56 shrink-0 border-l border-[#1B3B2B] bg-[#0a140f] p-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                <div>
                  <label className="block font-pixel text-[10px] tracking-widest text-[#4a6b57] mb-2">CUSTOM TAGS</label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(editingPost.tags || []).map((tag: string) => (
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
                    selectedTags={editingPost.tags || []} 
                    onAddTag={(tag) => {
                      const currentTags = editingPost.tags || [];
                      if (!currentTags.includes(tag)) setEditingPost({ ...editingPost, tags: [...currentTags, tag] });
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
              <svg className="w-16 h-16 mx-auto mb-4 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              <p>NO FILE SELECTED</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}