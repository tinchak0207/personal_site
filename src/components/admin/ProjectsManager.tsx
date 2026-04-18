import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Project } from '../../types';
import { NodeSelector } from './NodeSelector';

export function ProjectsManager({ setLoading, setErrorMsg }: { setLoading: (l: boolean) => void, setErrorMsg: (m: string) => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<string[]>(['/']);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (error) setErrorMsg(error.message);
    else if (data) setProjects(data);
    setLoading(false);
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const value = e.currentTarget.value.trim();
      if (value && editingProject) {
        const currentTags = editingProject.tags || [];
        if (!currentTags.includes(value)) {
          setEditingProject({ ...editingProject, tags: [...currentTags, value] });
        }
        e.currentTarget.value = '';
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    if (editingProject) {
      setEditingProject({
        ...editingProject,
        tags: (editingProject.tags || []).filter((tag: string) => tag !== tagToRemove)
      });
    }
  };

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('project-description-editor') as HTMLTextAreaElement;
    if (!textarea || !editingProject) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = editingProject.description || '';
    const selectedText = text.substring(start, end);

    const newText = text.substring(0, start) + prefix + selectedText + suffix + text.substring(end);
    setEditingProject({ ...editingProject, description: newText });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject || !editingProject.title || !editingProject.description) {
      setErrorMsg('Title and description are required');
      return;
    }
    
    setLoading(true);
    const projectData = {
      title: editingProject.title,
      description: editingProject.description,
      url: editingProject.url || null,
      github_url: editingProject.github_url || null,
      image_url: editingProject.image_url || null,
      published: editingProject.published || false,
      tags: editingProject.tags || [],
      folder: editingProject.folder?.trim() || '/',
    };

    if (editingProject.id) {
      const { error } = await supabase
        .from('projects')
        .update({ ...projectData, updated_at: new Date().toISOString() })
        .eq('id', editingProject.id);
        
      if (error) setErrorMsg(error.message);
      else {
        fetchProjects();
      }
    } else {
      const { data, error } = await supabase.from('projects').insert([projectData]).select();
      if (error) setErrorMsg(error.message);
      else if (data && data.length > 0) {
        setEditingProject(data[0]);
        fetchProjects();
      }
    }
    setLoading(false);
  };

  const handleDeleteProject = async () => {
    if (!editingProject?.id) return;
    if (!window.confirm('Delete this project permanently?')) return;
    
    setLoading(true);
    const { error } = await supabase.from('projects').delete().eq('id', editingProject.id);
    if (error) setErrorMsg(error.message);
    else {
      setEditingProject(null);
      fetchProjects();
    }
    setLoading(false);
  };

  // Group projects by folder
  const projectsByFolder = projects.reduce((acc, project) => {
    const f = project.folder || '/';
    if (!acc[f]) acc[f] = [];
    acc[f].push(project);
    return acc;
  }, {} as Record<string, Project[]>);

  const toggleFolder = (folder: string) => {
    if (expandedFolders.includes(folder)) {
      setExpandedFolders(expandedFolders.filter(f => f !== folder));
    } else {
      setExpandedFolders([...expandedFolders, folder]);
    }
  };

  const createNewProject = (folder: string = '/') => {
    setEditingProject({ title: '', description: '', published: false, folder, tags: [] });
  };

  return (
    <div className="flex h-[calc(100vh-150px)] border border-[#1B3B2B] bg-[#0a140f]/50">
      {/* File Explorer Sidebar (Obsidian Style) */}
      <div className="w-64 border-r border-[#1B3B2B] flex flex-col bg-[#030a07] shrink-0">
        <div className="p-3 border-b border-[#1B3B2B] flex justify-between items-center shrink-0">
          <span className="font-pixel text-xs tracking-widest text-[#4a6b57]">EXPLORER</span>
          <div className="flex gap-2">
            <button onClick={() => createNewProject('/')} className="text-[#A5D6B7] hover:text-[#4ADE80] transition-colors" title="New Project">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
            </button>
            <button onClick={() => {
              const newFolder = window.prompt('Enter new folder path (e.g. "Web3/DeFi"):');
              if (newFolder) createNewProject(newFolder);
            }} className="text-[#A5D6B7] hover:text-[#4ADE80] transition-colors" title="New Folder">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 font-mono text-sm">
          {Object.keys(projectsByFolder).sort().map(folder => {
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
                    onClick={(e) => { e.stopPropagation(); createNewProject(folder); }} 
                    className="ml-auto opacity-0 group-hover:opacity-100 hover:text-[#E8F5E9]"
                  >
                    +
                  </button>
                </div>
                
                {isExpanded && (
                  <div className="ml-4 pl-2 border-l border-[#1B3B2B]">
                    {projectsByFolder[folder].map(project => (
                      <div 
                        key={project.id}
                        onClick={() => setEditingProject(project)}
                        className={`truncate px-2 py-1 my-0.5 cursor-pointer rounded transition-colors text-xs ${editingProject?.id === project.id ? 'bg-[#1B3B2B] text-[#4ADE80] font-bold' : 'text-[#4a6b57] hover:bg-[#0a140f] hover:text-[#A5D6B7]'}`}
                      >
                        {project.title}
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
        {editingProject ? (
          <form onSubmit={handleSaveProject} className="flex flex-col h-full">
            {/* Editor Header */}
            <div className="flex justify-between items-center border-b border-[#1B3B2B] p-3 shrink-0 bg-[#0a140f]">
              <div className="flex items-center gap-2 w-1/2">
                <input 
                  type="text" 
                  value={editingProject.folder || ''}
                  onChange={(e) => setEditingProject({...editingProject, folder: e.target.value})}
                  className="bg-transparent border-none text-[#4a6b57] text-sm font-mono outline-none placeholder-[#4a6b57]/50 w-24 text-right shrink-0"
                  placeholder="/"
                />
                <span className="text-[#4a6b57]">/</span>
                <input 
                  type="text" 
                  value={editingProject.title || ''}
                  onChange={(e) => setEditingProject({...editingProject, title: e.target.value})}
                  className="bg-transparent border-none text-[#E8F5E9] text-xl font-pixel outline-none placeholder-[#4a6b57]/50 flex-1 min-w-0"
                  placeholder="Untitled Project"
                  required
                />
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <label className="flex items-center gap-2 cursor-pointer text-[#A5D6B7] hover:text-[#4ADE80] transition-colors font-pixel text-xs">
                  <input 
                    type="checkbox" 
                    checked={editingProject.published || false}
                    onChange={(e) => setEditingProject({...editingProject, published: e.target.checked})}
                    className="w-3 h-3 accent-[#4ADE80] bg-[#0a140f] border-[#1B3B2B]"
                  />
                  PUBLISH
                </label>
                <button type="submit" className="text-[#4ADE80] hover:text-[#E8F5E9] font-pixel text-sm transition-colors">SAVE</button>
                {editingProject.id && (
                  <button type="button" onClick={handleDeleteProject} className="text-red-900 hover:text-red-400 font-pixel text-sm transition-colors">DEL</button>
                )}
              </div>
            </div>

            <div className="flex flex-1 min-h-0 relative">
              {/* Markdown Editor */}
              <div className="flex-1 flex flex-col min-w-0">
                <div className="p-4 border-b border-[#1B3B2B] bg-[#0a140f]/50 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-pixel text-[10px] tracking-widest text-[#4a6b57] mb-2">URL (Optional)</label>
                    <input 
                      type="text" 
                      value={editingProject.url || ''}
                      onChange={(e) => setEditingProject({...editingProject, url: e.target.value})}
                      className="w-full bg-[#030a07] border border-[#1B3B2B] focus:border-[#4ADE80] text-[#A5D6B7] p-2 outline-none font-mono text-sm placeholder-[#4a6b57]/50 transition-colors"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block font-pixel text-[10px] tracking-widest text-[#4a6b57] mb-2">GITHUB URL (Optional)</label>
                    <input 
                      type="text" 
                      value={editingProject.github_url || ''}
                      onChange={(e) => setEditingProject({...editingProject, github_url: e.target.value})}
                      className="w-full bg-[#030a07] border border-[#1B3B2B] focus:border-[#4ADE80] text-[#A5D6B7] p-2 outline-none font-mono text-sm placeholder-[#4a6b57]/50 transition-colors"
                      placeholder="https://github.com/..."
                    />
                  </div>
                  <div>
                    <label className="block font-pixel text-[10px] tracking-widest text-[#4a6b57] mb-2">IMAGE URL (Optional)</label>
                    <input 
                      type="text" 
                      value={editingProject.image_url || ''}
                      onChange={(e) => setEditingProject({...editingProject, image_url: e.target.value})}
                      className="w-full bg-[#030a07] border border-[#1B3B2B] focus:border-[#4ADE80] text-[#A5D6B7] p-2 outline-none font-mono text-sm placeholder-[#4a6b57]/50 transition-colors"
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div className="flex gap-1 p-2 bg-[#0a140f] border-b border-[#1B3B2B] shrink-0">
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertMarkdown('**', '**')} className="px-2 py-1 text-[#A5D6B7] font-mono text-xs hover:bg-[#1B3B2B] hover:text-[#4ADE80] transition-colors rounded" title="Bold">B</button>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertMarkdown('*', '*')} className="px-2 py-1 text-[#A5D6B7] font-mono text-xs hover:bg-[#1B3B2B] hover:text-[#4ADE80] transition-colors italic rounded" title="Italic">I</button>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertMarkdown('### ', '')} className="px-2 py-1 text-[#A5D6B7] font-mono text-xs hover:bg-[#1B3B2B] hover:text-[#4ADE80] transition-colors font-bold rounded" title="Heading">H</button>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertMarkdown('[', '](url)')} className="px-2 py-1 text-[#A5D6B7] font-mono text-xs hover:bg-[#1B3B2B] hover:text-[#4ADE80] transition-colors rounded" title="Link">L</button>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertMarkdown('```\n', '\n```')} className="px-2 py-1 text-[#A5D6B7] font-mono text-xs hover:bg-[#1B3B2B] hover:text-[#4ADE80] transition-colors rounded" title="Code Block">{'<>'}</button>
                </div>
                <textarea 
                  id="project-description-editor"
                  value={editingProject.description || ''}
                  onChange={(e) => setEditingProject({...editingProject, description: e.target.value})}
                  className="flex-1 w-full bg-transparent border-none text-[#A5D6B7] p-6 font-mono outline-none resize-none placeholder-[#4a6b57]/30 custom-scrollbar leading-relaxed"
                  placeholder="Project description (Markdown supported)..."
                  required
                />
              </div>

              {/* Properties Sidebar (Right) */}
              <div className="w-56 shrink-0 border-l border-[#1B3B2B] bg-[#0a140f] p-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                <div>
                  <label className="block font-pixel text-[10px] tracking-widest text-[#4a6b57] mb-2">CUSTOM TAGS</label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(editingProject.tags || []).map((tag: string) => (
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
                    selectedTags={editingProject.tags || []} 
                    onAddTag={(tag) => {
                      const currentTags = editingProject.tags || [];
                      if (!currentTags.includes(tag)) setEditingProject({ ...editingProject, tags: [...currentTags, tag] });
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
