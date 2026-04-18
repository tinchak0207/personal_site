import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Post } from '../../types';
import { NodeSelector } from './NodeSelector';

export function RamblingsManager({ setLoading, setErrorMsg }: { setLoading: (l: boolean) => void, setErrorMsg: (m: string) => void }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [editingPost, setEditingPost] = useState<Partial<Post> | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    
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

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('markdown-editor') as HTMLTextAreaElement;
    if (!textarea || !editingPost) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = editingPost.content || '';
    const selectedText = text.substring(start, end);

    const newText = text.substring(0, start) + prefix + selectedText + suffix + text.substring(end);
    setEditingPost({ ...editingPost, content: newText });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost || !editingPost.title) {
      setErrorMsg('Title is required');
      return;
    }
    
    const finalSlug = editingPost.slug || editingPost.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    setLoading(true);
    const postData = {
      title: editingPost.title,
      slug: finalSlug,
      content: editingPost.content,
      published: editingPost.published,
      tags: editingPost.tags || [],
    };

    if (editingPost.id) {
      const { error } = await supabase
        .from('posts')
        .update({ ...postData, updated_at: new Date().toISOString() })
        .eq('id', editingPost.id);
        
      if (error) setErrorMsg(error.message);
      else {
        setEditingPost(null);
        fetchPosts();
      }
    } else {
      const { error } = await supabase.from('posts').insert([postData]);
      if (error) setErrorMsg(error.message);
      else {
        setEditingPost(null);
        fetchPosts();
      }
    }
    setLoading(false);
  };

    if (editingPost) {
      return (
        <form onSubmit={handleSavePost} className="flex flex-col h-[calc(100vh-200px)]">
          {/* Header Bar */}
          <div className="flex justify-between items-center border-b border-[#1B3B2B] pb-3 mb-4 shrink-0">
            <input 
              type="text" 
              value={editingPost.title || ''}
              onChange={(e) => setEditingPost({...editingPost, title: e.target.value})}
              className="bg-transparent border-none text-[#E8F5E9] text-2xl font-pixel outline-none placeholder-[#4a6b57]/50 w-1/2"
              placeholder="Untitled Log"
              required
            />
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-[#A5D6B7] hover:text-[#4ADE80] transition-colors font-pixel text-xs">
                <input 
                  type="checkbox" 
                  checked={editingPost.published || false}
                  onChange={(e) => setEditingPost({...editingPost, published: e.target.checked})}
                  className="w-3 h-3 accent-[#4ADE80] bg-[#0a140f] border-[#1B3B2B]"
                />
                PUBLISH
              </label>
              <button type="button" onClick={() => setEditingPost(null)} className="text-[#4a6b57] hover:text-red-400 font-pixel text-sm transition-colors">DISCARD</button>
              <button type="submit" className="text-[#030a07] bg-[#4ADE80] px-4 py-1.5 font-pixel text-sm hover:bg-[#E8F5E9] transition-colors shadow-[0_0_10px_rgba(74,222,128,0.2)]">COMMIT</button>
            </div>
          </div>
  
          <div className="flex flex-1 gap-6 min-h-0">
            {/* Left Column: Properties (Tags, etc) */}
            <div className="w-64 shrink-0 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
              <div className="border border-[#1B3B2B] bg-[#0a140f]/50 p-4">
                <h3 className="font-pixel text-xs text-[#4a6b57] mb-3 border-b border-[#1B3B2B] pb-2">PROPERTIES</h3>
                
                <div className="mb-4">
                  <label className="block font-pixel text-[10px] tracking-widest text-[#4a6b57] mb-2">CUSTOM TAGS</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(editingPost.tags || []).map((tag: string) => (
                      <span key={tag} className="flex items-center gap-1 bg-[#1B3B2B] text-[#4ADE80] px-2 py-0.5 text-[10px] font-pixel border border-[#4a6b57] hover:border-red-900 transition-colors group cursor-pointer" onClick={() => removeTag(tag)}>
                        #{tag}
                        <span className="text-[#E8F5E9] opacity-0 group-hover:opacity-100 group-hover:text-red-400 transition-opacity">×</span>
                      </span>
                    ))}
                  </div>
                  <input 
                    type="text" 
                    onKeyDown={handleTagInput}
                    className="w-full bg-[#030a07] border border-[#1B3B2B] focus:border-[#4ADE80] text-[#E8F5E9] p-2 outline-none font-pixel text-[10px] placeholder-[#4a6b57]/50 transition-colors"
                    placeholder="Add tag..."
                  />
                </div>
                
                <div className="mb-2">
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
  
            {/* Right Column: Editor */}
            <div className="flex-1 flex flex-col min-h-0 border border-[#1B3B2B] bg-[#0a140f]/30">
              <div className="flex justify-between items-center bg-[#0a140f] border-b border-[#1B3B2B] p-2 shrink-0">
                <span className="font-pixel text-[10px] tracking-widest text-[#4a6b57] ml-2">MARKDOWN EDITOR</span>
                <div className="flex gap-1">
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertMarkdown('**', '**')} className="px-2 py-1 text-[#A5D6B7] font-mono text-xs hover:bg-[#1B3B2B] hover:text-[#4ADE80] transition-colors" title="Bold">B</button>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertMarkdown('*', '*')} className="px-2 py-1 text-[#A5D6B7] font-mono text-xs hover:bg-[#1B3B2B] hover:text-[#4ADE80] transition-colors italic" title="Italic">I</button>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertMarkdown('### ', '')} className="px-2 py-1 text-[#A5D6B7] font-mono text-xs hover:bg-[#1B3B2B] hover:text-[#4ADE80] transition-colors font-bold" title="Heading">H</button>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertMarkdown('[', '](url)')} className="px-2 py-1 text-[#A5D6B7] font-mono text-xs hover:bg-[#1B3B2B] hover:text-[#4ADE80] transition-colors" title="Link">L</button>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertMarkdown('![alt](', ')')} className="px-2 py-1 text-[#A5D6B7] font-mono text-xs hover:bg-[#1B3B2B] hover:text-[#4ADE80] transition-colors" title="Image">IMG</button>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertMarkdown('```\n', '\n```')} className="px-2 py-1 text-[#A5D6B7] font-mono text-xs hover:bg-[#1B3B2B] hover:text-[#4ADE80] transition-colors" title="Code Block">{'<>'}</button>
                </div>
              </div>
              <textarea 
                id="markdown-editor"
                value={editingPost.content || ''}
                onChange={(e) => setEditingPost({...editingPost, content: e.target.value})}
                className="flex-1 w-full bg-transparent border-none text-[#A5D6B7] p-6 font-mono outline-none resize-none placeholder-[#4a6b57]/30 custom-scrollbar leading-relaxed"
                placeholder="Start typing..."
              />
            </div>
          </div>
        </form>
      );
    }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-pixel text-[#A5D6B7]">STORED LOGS (碎碎念)</h2>
        <button 
          onClick={() => setEditingPost({ title: '', slug: '', content: '', published: false })}
          className="border border-[#4ADE80] text-[#4ADE80] px-4 py-2 font-pixel text-sm hover:bg-[#4ADE80] hover:text-[#030a07] transition-colors"
        >
          + ALLOCATE NEW LOG
        </button>
      </div>

      <div className="grid gap-4">
        {posts.map(post => (
          <div key={post.id} className="border border-[#1B3B2B] p-4 flex justify-between items-center bg-[#0a140f]/30 hover:border-[#4a6b57] transition-colors">
            <div>
              <h3 className="font-pixel text-[#E8F5E9] text-lg mb-1">{post.title}</h3>
              <div className="flex gap-4 font-pixel text-[10px] tracking-widest text-[#4a6b57]">
                <span>/{post.slug}</span>
                <span>{new Date(post.created_at).toLocaleDateString()}</span>
                <span className={post.published ? "text-[#4ADE80]" : "text-yellow-600"}>
                  {post.published ? 'PUBLISHED' : 'DRAFT'}
                </span>
              </div>
            </div>
            <button 
              onClick={() => setEditingPost(post)}
              className="text-[#4a6b57] hover:text-[#4ADE80] font-pixel text-xs px-3 py-1 border border-transparent hover:border-[#4ADE80] transition-all"
            >
              EDIT
            </button>
          </div>
        ))}
        {posts.length === 0 && (
          <div className="text-[#4a6b57] font-pixel text-center py-12 border border-dashed border-[#1B3B2B]">
            NO LOGS FOUND. DATABASE IS EMPTY.
          </div>
        )}
      </div>
    </div>
  );
}
