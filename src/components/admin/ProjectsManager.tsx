import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Project } from '../../types';
import { NodeSelector } from './NodeSelector';

export function ProjectsManager({ setLoading, setErrorMsg }: { setLoading: (l: boolean) => void, setErrorMsg: (m: string) => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);

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
    };

    if (editingProject.id) {
      const { error } = await supabase
        .from('projects')
        .update({ ...projectData, updated_at: new Date().toISOString() })
        .eq('id', editingProject.id);
        
      if (error) setErrorMsg(error.message);
      else {
        setEditingProject(null);
        fetchProjects();
      }
    } else {
      const { error } = await supabase.from('projects').insert([projectData]);
      if (error) setErrorMsg(error.message);
      else {
        setEditingProject(null);
        fetchProjects();
      }
    }
    setLoading(false);
  };

  if (editingProject) {
    return (
      <form onSubmit={handleSaveProject} className="flex flex-col gap-6">
        <div className="flex justify-between items-center border-b border-[#1B3B2B] pb-4">
          <h2 className="text-xl font-pixel text-[#A5D6B7]">{editingProject.id ? 'EDIT PROJECT' : 'NEW PROJECT'}</h2>
          <div className="flex gap-4">
            <button type="button" onClick={() => setEditingProject(null)} className="text-[#4a6b57] hover:text-[#A5D6B7] font-pixel text-sm transition-colors">CANCEL</button>
            <button type="submit" className="text-[#030a07] bg-[#4ADE80] px-4 py-1 font-pixel text-sm hover:bg-[#E8F5E9] transition-colors">COMMIT</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-pixel text-xs text-[#4a6b57] mb-2">TITLE</label>
            <input 
              type="text" 
              value={editingProject.title || ''}
              onChange={(e) => setEditingProject({...editingProject, title: e.target.value})}
              className="w-full bg-[#0a140f] border border-[#1B3B2B] focus:border-[#4ADE80] text-[#E8F5E9] p-3 outline-none placeholder-[#4a6b57]/50"
              placeholder="Project Title"
              required
            />
          </div>
          <div>
            <label className="block font-pixel text-xs text-[#4a6b57] mb-2">URL (Optional)</label>
            <input 
              type="text" 
              value={editingProject.url || ''}
              onChange={(e) => setEditingProject({...editingProject, url: e.target.value})}
              className="w-full bg-[#0a140f] border border-[#1B3B2B] focus:border-[#4ADE80] text-[#E8F5E9] p-3 outline-none placeholder-[#4a6b57]/50"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block font-pixel text-xs text-[#4a6b57] mb-2">GITHUB URL (Optional)</label>
            <input 
              type="text" 
              value={editingProject.github_url || ''}
              onChange={(e) => setEditingProject({...editingProject, github_url: e.target.value})}
              className="w-full bg-[#0a140f] border border-[#1B3B2B] focus:border-[#4ADE80] text-[#E8F5E9] p-3 outline-none placeholder-[#4a6b57]/50"
              placeholder="https://github.com/..."
            />
          </div>
          <div>
            <label className="block font-pixel text-xs text-[#4a6b57] mb-2">IMAGE URL (Optional)</label>
            <input 
              type="text" 
              value={editingProject.image_url || ''}
              onChange={(e) => setEditingProject({...editingProject, image_url: e.target.value})}
              className="w-full bg-[#0a140f] border border-[#1B3B2B] focus:border-[#4ADE80] text-[#E8F5E9] p-3 outline-none placeholder-[#4a6b57]/50"
              placeholder="https://..."
            />
          </div>
        </div>

        <NodeSelector 
          selectedTags={editingProject.tags || []} 
          onAddTag={(tag) => {
            const currentTags = editingProject.tags || [];
            if (!currentTags.includes(tag)) setEditingProject({ ...editingProject, tags: [...currentTags, tag] });
          }}
          onRemoveTag={removeTag}
        />

        <div>
          <label className="block font-pixel text-xs text-[#4a6b57] mb-2">CUSTOM TAGS</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {(editingProject.tags || []).map((tag: string) => (
              <span key={tag} className="flex items-center gap-1 bg-[#1B3B2B] text-[#4ADE80] px-3 py-1 text-sm font-pixel border border-[#4a6b57]">
                #{tag}
                <button type="button" onClick={() => removeTag(tag)} className="ml-1 text-[#E8F5E9] hover:text-red-400 focus:outline-none">×</button>
              </span>
            ))}
          </div>
          <input 
            type="text" 
            onKeyDown={handleTagInput}
            className="w-full bg-[#0a140f] border border-[#1B3B2B] focus:border-[#4ADE80] text-[#E8F5E9] p-3 outline-none font-pixel text-sm placeholder-[#4a6b57]/50"
            placeholder="Type tag and press Enter or Comma..."
          />
        </div>

        <div className="flex items-center gap-3">
          <input 
            type="checkbox" 
            id="published"
            checked={editingProject.published || false}
            onChange={(e) => setEditingProject({...editingProject, published: e.target.checked})}
            className="w-4 h-4 accent-[#4ADE80] bg-[#0a140f] border-[#1B3B2B]"
          />
          <label htmlFor="published" className="font-pixel text-sm text-[#A5D6B7] cursor-pointer">
            PUBLISH TO PUBLIC ARCHIVE
          </label>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-end mb-2">
            <label className="block font-pixel text-xs text-[#4a6b57]">DESCRIPTION</label>
            <div className="flex gap-1 bg-[#0a140f] border border-[#1B3B2B] p-1 rounded-sm">
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertMarkdown('**', '**')} className="p-1.5 text-[#A5D6B7] hover:bg-[#1B3B2B] hover:text-[#4ADE80] transition-colors rounded" title="Bold">B</button>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertMarkdown('*', '*')} className="p-1.5 text-[#A5D6B7] hover:bg-[#1B3B2B] hover:text-[#4ADE80] transition-colors rounded" title="Italic">I</button>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertMarkdown('### ', '')} className="p-1.5 text-[#A5D6B7] hover:bg-[#1B3B2B] hover:text-[#4ADE80] transition-colors rounded" title="Heading">H</button>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertMarkdown('[', '](url)')} className="p-1.5 text-[#A5D6B7] hover:bg-[#1B3B2B] hover:text-[#4ADE80] transition-colors rounded" title="Link">L</button>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertMarkdown('```\n', '\n```')} className="p-1.5 text-[#A5D6B7] hover:bg-[#1B3B2B] hover:text-[#4ADE80] transition-colors rounded" title="Code Block">{'<>'}</button>
            </div>
          </div>
          <textarea 
            id="project-description-editor"
            value={editingProject.description || ''}
            onChange={(e) => setEditingProject({...editingProject, description: e.target.value})}
            className="flex-1 w-full bg-[#0a140f] border border-[#1B3B2B] focus:border-[#4ADE80] text-[#A5D6B7] p-4 font-mono outline-none resize-y min-h-[200px] placeholder-[#4a6b57]/50"
            placeholder="Project description..."
            required
          />
        </div>
      </form>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-pixel text-[#A5D6B7]">STORED PROJECTS (個人項目)</h2>
        <button 
          onClick={() => setEditingProject({ title: '', description: '', published: false })}
          className="border border-[#4ADE80] text-[#4ADE80] px-4 py-2 font-pixel text-sm hover:bg-[#4ADE80] hover:text-[#030a07] transition-colors"
        >
          + ALLOCATE NEW PROJECT
        </button>
      </div>

      <div className="grid gap-4">
        {projects.map(project => (
          <div key={project.id} className="border border-[#1B3B2B] p-4 flex justify-between items-center bg-[#0a140f]/30 hover:border-[#4a6b57] transition-colors">
            <div>
              <h3 className="font-pixel text-[#E8F5E9] text-lg mb-1">{project.title}</h3>
              <div className="flex gap-4 font-pixel text-[10px] tracking-widest text-[#4a6b57]">
                <span>{new Date(project.created_at).toLocaleDateString()}</span>
                <span className={project.published ? "text-[#4ADE80]" : "text-yellow-600"}>
                  {project.published ? 'PUBLISHED' : 'DRAFT'}
                </span>
              </div>
            </div>
            <button 
              onClick={() => setEditingProject(project)}
              className="text-[#4a6b57] hover:text-[#4ADE80] font-pixel text-xs px-3 py-1 border border-transparent hover:border-[#4ADE80] transition-all"
            >
              EDIT
            </button>
          </div>
        ))}
        {projects.length === 0 && (
          <div className="text-[#4a6b57] font-pixel text-center py-12 border border-dashed border-[#1B3B2B]">
            NO PROJECTS FOUND. DATABASE IS EMPTY.
          </div>
        )}
      </div>
    </div>
  );
}
