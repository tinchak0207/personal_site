import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ExternalLink } from '../../types';
import { NodeSelector } from './NodeSelector';

export function ExternalLinksManager({ setLoading, setErrorMsg }: { setLoading: (l: boolean) => void, setErrorMsg: (m: string) => void }) {
  const [links, setLinks] = useState<ExternalLink[]>([]);
  const [editingLink, setEditingLink] = useState<Partial<ExternalLink> | null>(null);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('external_links')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (error) setErrorMsg(error.message);
    else if (data) setLinks(data);
    setLoading(false);
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const value = e.currentTarget.value.trim();
      if (value && editingLink) {
        const currentTags = editingLink.tags || [];
        if (!currentTags.includes(value)) {
          setEditingLink({ ...editingLink, tags: [...currentTags, value] });
        }
        e.currentTarget.value = '';
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    if (editingLink) {
      setEditingLink({
        ...editingLink,
        tags: (editingLink.tags || []).filter((tag: string) => tag !== tagToRemove)
      });
    }
  };

  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLink || !editingLink.title || !editingLink.url) {
      setErrorMsg('Title and URL are required');
      return;
    }
    
    setLoading(true);
    const linkData = {
      title: editingLink.title,
      url: editingLink.url,
      description: editingLink.description || null,
      published: editingLink.published || false,
      tags: editingLink.tags || [],
    };

    if (editingLink.id) {
      const { error } = await supabase
        .from('external_links')
        .update({ ...linkData, updated_at: new Date().toISOString() })
        .eq('id', editingLink.id);
        
      if (error) setErrorMsg(error.message);
      else {
        setEditingLink(null);
        fetchLinks();
      }
    } else {
      const { error } = await supabase.from('external_links').insert([linkData]);
      if (error) setErrorMsg(error.message);
      else {
        setEditingLink(null);
        fetchLinks();
      }
    }
    setLoading(false);
  };

  if (editingLink) {
    return (
      <form onSubmit={handleSaveLink} className="flex flex-col gap-6">
        <div className="flex justify-between items-center border-b border-[#1B3B2B] pb-4">
          <h2 className="text-xl font-pixel text-[#A5D6B7]">{editingLink.id ? 'EDIT LINK' : 'NEW LINK'}</h2>
          <div className="flex gap-4">
            <button type="button" onClick={() => setEditingLink(null)} className="text-[#4a6b57] hover:text-[#A5D6B7] font-pixel text-sm transition-colors">CANCEL</button>
            <button type="submit" className="text-[#030a07] bg-[#4ADE80] px-4 py-1 font-pixel text-sm hover:bg-[#E8F5E9] transition-colors">COMMIT</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-pixel text-xs text-[#4a6b57] mb-2">TITLE</label>
            <input 
              type="text" 
              value={editingLink.title || ''}
              onChange={(e) => setEditingLink({...editingLink, title: e.target.value})}
              className="w-full bg-[#0a140f] border border-[#1B3B2B] focus:border-[#4ADE80] text-[#E8F5E9] p-3 outline-none placeholder-[#4a6b57]/50"
              placeholder="Link Title"
              required
            />
          </div>
          <div>
            <label className="block font-pixel text-xs text-[#4a6b57] mb-2">URL</label>
            <input 
              type="text" 
              value={editingLink.url || ''}
              onChange={(e) => setEditingLink({...editingLink, url: e.target.value})}
              className="w-full bg-[#0a140f] border border-[#1B3B2B] focus:border-[#4ADE80] text-[#E8F5E9] p-3 outline-none placeholder-[#4a6b57]/50"
              placeholder="https://..."
              required
            />
          </div>
        </div>

        <NodeSelector 
          selectedTags={editingLink.tags || []} 
          onAddTag={(tag) => {
            const currentTags = editingLink.tags || [];
            if (!currentTags.includes(tag)) setEditingLink({ ...editingLink, tags: [...currentTags, tag] });
          }}
          onRemoveTag={removeTag}
        />

        <div>
          <label className="block font-pixel text-xs text-[#4a6b57] mb-2">CUSTOM TAGS</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {(editingLink.tags || []).map((tag: string) => (
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
            checked={editingLink.published || false}
            onChange={(e) => setEditingLink({...editingLink, published: e.target.checked})}
            className="w-4 h-4 accent-[#4ADE80] bg-[#0a140f] border-[#1B3B2B]"
          />
          <label htmlFor="published" className="font-pixel text-sm text-[#A5D6B7] cursor-pointer">
            PUBLISH TO PUBLIC ARCHIVE
          </label>
        </div>

        <div className="flex-1 flex flex-col">
          <label className="block font-pixel text-xs text-[#4a6b57] mb-2">DESCRIPTION (Optional)</label>
          <textarea 
            value={editingLink.description || ''}
            onChange={(e) => setEditingLink({...editingLink, description: e.target.value})}
            className="flex-1 w-full bg-[#0a140f] border border-[#1B3B2B] focus:border-[#4ADE80] text-[#A5D6B7] p-4 font-mono outline-none resize-y min-h-[100px] placeholder-[#4a6b57]/50"
            placeholder="Short description..."
          />
        </div>
      </form>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-pixel text-[#A5D6B7]">STORED LINKS (外部鏈接)</h2>
        <button 
          onClick={() => setEditingLink({ title: '', url: '', published: false })}
          className="border border-[#4ADE80] text-[#4ADE80] px-4 py-2 font-pixel text-sm hover:bg-[#4ADE80] hover:text-[#030a07] transition-colors"
        >
          + ALLOCATE NEW LINK
        </button>
      </div>

      <div className="grid gap-4">
        {links.map(link => (
          <div key={link.id} className="border border-[#1B3B2B] p-4 flex justify-between items-center bg-[#0a140f]/30 hover:border-[#4a6b57] transition-colors">
            <div>
              <h3 className="font-pixel text-[#E8F5E9] text-lg mb-1">{link.title}</h3>
              <div className="flex gap-4 font-pixel text-[10px] tracking-widest text-[#4a6b57]">
                <span>{new Date(link.created_at).toLocaleDateString()}</span>
                <span className={link.published ? "text-[#4ADE80]" : "text-yellow-600"}>
                  {link.published ? 'PUBLISHED' : 'DRAFT'}
                </span>
              </div>
            </div>
            <button 
              onClick={() => setEditingLink(link)}
              className="text-[#4a6b57] hover:text-[#4ADE80] font-pixel text-xs px-3 py-1 border border-transparent hover:border-[#4ADE80] transition-all"
            >
              EDIT
            </button>
          </div>
        ))}
        {links.length === 0 && (
          <div className="text-[#4a6b57] font-pixel text-center py-12 border border-dashed border-[#1B3B2B]">
            NO LINKS FOUND. DATABASE IS EMPTY.
          </div>
        )}
      </div>
    </div>
  );
}
