import { useEffect, useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { CRTFilter } from '../components/CRTFilter';
import { Post, NewPost } from '../types';

export interface MarkdownEditorRef {
  getContent: () => string;
}

const MarkdownEditor = forwardRef<MarkdownEditorRef, { initialValue: string }>(({ initialValue }, ref) => {
  const [localContent, setLocalContent] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalContent(initialValue);
  }, [initialValue]);

  useImperativeHandle(ref, () => ({
    getContent: () => localContent
  }));

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalContent(e.target.value);
  };

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = localContent || '';
    const selectedText = text.substring(start, end);

    const newText = text.substring(0, start) + prefix + selectedText + suffix + text.substring(end);
    setLocalContent(newText);

    // Reset focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  return (
    <div className="flex-1 flex flex-col min-h-[500px]">
      <div className="flex justify-between items-end mb-2">
        <label className="block font-pixel text-xs text-[#4a6b57]">MARKDOWN CONTENT</label>
        <div className="flex gap-1 bg-[#0a140f] border border-[#1B3B2B] p-1 rounded-sm">
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertMarkdown('**', '**')} className="p-1.5 text-[#A5D6B7] hover:bg-[#1B3B2B] hover:text-[#4ADE80] transition-colors rounded" title="Bold">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 12a4 4 0 0 0 0-8H6v8"/><path d="M15 20a4 4 0 0 0 0-8H6v8Z"/></svg>
          </button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertMarkdown('*', '*')} className="p-1.5 text-[#A5D6B7] hover:bg-[#1B3B2B] hover:text-[#4ADE80] transition-colors rounded" title="Italic">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
          </button>
          <div className="w-px bg-[#1B3B2B] mx-1"></div>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertMarkdown('### ', '')} className="p-1.5 text-[#A5D6B7] hover:bg-[#1B3B2B] hover:text-[#4ADE80] transition-colors rounded" title="Heading">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1"/></svg>
          </button>
          <div className="w-px bg-[#1B3B2B] mx-1"></div>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertMarkdown('[', '](url)')} className="p-1.5 text-[#A5D6B7] hover:bg-[#1B3B2B] hover:text-[#4ADE80] transition-colors rounded" title="Link">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          </button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertMarkdown('![alt](', ')')} className="p-1.5 text-[#A5D6B7] hover:bg-[#1B3B2B] hover:text-[#4ADE80] transition-colors rounded" title="Image">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </button>
          <div className="w-px bg-[#1B3B2B] mx-1"></div>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertMarkdown('```\n', '\n```')} className="p-1.5 text-[#A5D6B7] hover:bg-[#1B3B2B] hover:text-[#4ADE80] transition-colors rounded" title="Code Block">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          </button>
        </div>
      </div>
      <textarea 
        ref={textareaRef}
        value={localContent}
        onChange={handleChange}
        className="flex-1 w-full bg-[#0a140f] border border-[#1B3B2B] focus:border-[#4ADE80] text-[#A5D6B7] p-4 font-mono outline-none resize-y min-h-[400px] placeholder-[#4a6b57]/50"
        placeholder="# H1 Header&#10;Write your thoughts here..."
      />
    </div>
  );
});

export function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [posts, setPosts] = useState<Post[]>([]);
  const [editingPost, setEditingPost] = useState<Partial<Post> | null>(null);
  const editorRef = useRef<MarkdownEditorRef>(null);

  useEffect(() => {
    let isMounted = true;
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) {
        setSession(session);
        setLoading(false);
        if (session) fetchAdminPosts();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setSession(session);
        if (session) fetchAdminPosts();
      }
    });

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const fetchAdminPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100); // Add a limit to prevent overloading memory with too many posts
    
    if (error) {
      setErrorMsg(error.message);
    } else if (data) {
      setPosts(data);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setErrorMsg(error.message);
    setLoading(false);
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const value = e.currentTarget.value.trim();
      if (value) {
        // Prevent duplicate tags
        const currentTags = editingPost.tags || [];
        if (!currentTags.includes(value)) {
          setEditingPost({
            ...editingPost,
            tags: [...currentTags, value]
          });
        }
        e.currentTarget.value = '';
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEditingPost({
      ...editingPost,
      tags: (editingPost.tags || []).filter((tag: string) => tag !== tagToRemove)
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setPosts([]);
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost.title) {
      setErrorMsg('Title is required');
      return;
    }
    
    // Automatically generate slug before saving if it's empty
    const finalSlug = editingPost.slug || editingPost.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const finalContent = editorRef.current?.getContent() || editingPost.content || '';

    setLoading(true);
    const postData = {
      title: editingPost.title,
      slug: finalSlug,
      content: finalContent,
      published: editingPost.published,
      tags: editingPost.tags || [],
    };

    if (editingPost.id) {
      // Update
      const { error } = await supabase
        .from('posts')
        .update({
          ...postData,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingPost.id);
        
      if (error) setErrorMsg(error.message);
      else {
        setEditingPost(null);
        fetchAdminPosts();
      }
    } else {
      // Insert
      const { error } = await supabase
        .from('posts')
        .insert([postData]);
        
      if (error) setErrorMsg(error.message);
      else {
        setEditingPost(null);
        fetchAdminPosts();
      }
    }
    setLoading(false);
  };

  if (loading && !session && !errorMsg) {
    return (
      <div className="min-h-screen bg-[#030a07] text-[#4ADE80] font-pixel p-12 flex items-center justify-center">
        LOADING SYSTEM...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="relative min-h-screen bg-[#030a07] text-[#8FBC8F] font-mono flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="border border-[#1B3B2B] p-8 max-w-md w-full bg-[#0a140f]/50 backdrop-blur-sm relative z-10">
          <h2 className="text-2xl font-pixel tracking-widest text-[#E8F5E9] mb-6">SYS_ADMIN // LOGIN</h2>
          
          {errorMsg && <div className="text-red-400 font-pixel text-sm mb-4 border border-red-900 p-2">{errorMsg}</div>}
          
          <div className="mb-4">
            <label className="block font-pixel text-xs tracking-widest text-[#4a6b57] mb-2">IDENTIFIER (EMAIL)</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#030a07] border border-[#1B3B2B] focus:border-[#4ADE80] text-[#A5D6B7] p-2 font-mono outline-none transition-colors placeholder-[#4a6b57]/50"
              placeholder="admin@system.local"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block font-pixel text-xs tracking-widest text-[#4a6b57] mb-2">PASSPHRASE</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#030a07] border border-[#1B3B2B] focus:border-[#4ADE80] text-[#A5D6B7] p-2 font-mono outline-none transition-colors placeholder-[#4a6b57]/50"
              placeholder="••••••••"
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full border border-[#4ADE80] text-[#4ADE80] font-pixel tracking-widest p-3 hover:bg-[#4ADE80] hover:text-[#030a07] transition-colors disabled:opacity-50"
          >
            {loading ? 'AUTHENTICATING...' : 'INITIALIZE CONNECTION'}
          </button>
        </form>
        <CRTFilter />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#030a07] text-[#8FBC8F] font-mono p-8 md:p-12">
      <div className="max-w-6xl mx-auto relative z-10 pb-24">
        <header className="flex justify-between items-center mb-12 border-b border-[#1B3B2B] pb-6">
          <h1 className="text-2xl font-pixel tracking-widest text-[#E8F5E9]">
            NEURAL ADMIN_CONSOLE
          </h1>
          <button 
            onClick={handleLogout}
            className="text-[#4a6b57] hover:text-red-400 font-pixel tracking-widest text-xs transition-colors"
          >
            [ DISCONNECT ]
          </button>
        </header>

        {errorMsg && (
          <div className="mb-6 p-3 border border-red-900 text-red-400 font-pixel text-sm">
            ERROR: {errorMsg}
          </div>
        )}

        {editingPost ? (
          <form onSubmit={handleSavePost} className="flex flex-col gap-6">
            <div className="flex justify-between items-center border-b border-[#1B3B2B] pb-4">
              <h2 className="text-xl font-pixel text-[#A5D6B7]">
                {editingPost.id ? 'EDIT LOG' : 'NEW LOG'}
              </h2>
              <div className="flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setEditingPost(null)}
                  className="text-[#4a6b57] hover:text-[#A5D6B7] font-pixel text-sm transition-colors"
                >
                  CANCEL
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="text-[#030a07] bg-[#4ADE80] px-4 py-1 font-pixel text-sm hover:bg-[#E8F5E9] transition-colors disabled:opacity-50"
                >
                  {loading ? 'SAVING...' : 'COMMIT'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block font-pixel text-xs text-[#4a6b57] mb-2">TITLE</label>
                <input 
                type="text" 
                value={editingPost.title || ''}
                onChange={(e) => setEditingPost({...editingPost, title: e.target.value})}
                className="w-full bg-[#0a140f] border border-[#1B3B2B] focus:border-[#4ADE80] text-[#E8F5E9] p-3 outline-none placeholder-[#4a6b57]/50"
                placeholder="Enter log title..."
                required
              />
              </div>
            </div>

            <div>
              <label className="block font-pixel text-xs text-[#4a6b57] mb-2">TAGS</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(editingPost.tags || []).map((tag: string) => (
                  <span 
                    key={tag} 
                    className="flex items-center gap-1 bg-[#1B3B2B] text-[#4ADE80] px-3 py-1 text-sm font-pixel border border-[#4a6b57]"
                  >
                    #{tag}
                    <button 
                      type="button" 
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-[#E8F5E9] hover:text-red-400 focus:outline-none"
                    >
                      ×
                    </button>
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
                checked={editingPost.published || false}
                onChange={(e) => setEditingPost({...editingPost, published: e.target.checked})}
                className="w-4 h-4 accent-[#4ADE80] bg-[#0a140f] border-[#1B3B2B]"
              />
              <label htmlFor="published" className="font-pixel text-sm text-[#A5D6B7] cursor-pointer">
                PUBLISH TO PUBLIC ARCHIVE
              </label>
            </div>

            {/* Markdown editor state is kept isolated to avoid re-rendering Admin on every keystroke */}
            <MarkdownEditor 
              key={editingPost.id || 'new'}
              ref={editorRef}
              initialValue={editingPost.content || ''} 
            />
          </form>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-pixel text-[#A5D6B7]">STORED LOGS</h2>
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
        )}
      </div>
      <CRTFilter />
    </div>
  );
}