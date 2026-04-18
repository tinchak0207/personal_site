import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CRTFilter } from '../components/CRTFilter';

import { Post } from '../types';

type BlogListItem = Pick<Post, 'id' | 'title' | 'slug' | 'created_at' | 'tags'>;

export function Blog() {
  const [posts, setPosts] = useState<BlogListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, slug, created_at, tags')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(50); // Added limit to prevent infinite data fetching

      if (error) {
        console.error('Error fetching posts:', error);
      } else {
        setPosts(data || []);
      }
      setLoading(false);
    }

    fetchPosts();
  }, []);

  return (
    <div className="relative min-h-screen bg-[#030a07] text-[#8FBC8F] font-mono p-8 md:p-24 selection:bg-[#4ADE80] selection:text-[#030a07]">
      <div className="max-w-3xl mx-auto relative z-10">
        <header className="mb-16 border-b border-[#1B3B2B] pb-8">
          <Link to="/" className="inline-block mb-4 text-[#4a6b57] hover:text-[#4ADE80] transition-colors font-pixel tracking-widest text-sm">
            {'< RETURN TO NEURAL CORE'}
          </Link>
          <h1 className="text-4xl md:text-6xl font-pixel tracking-wider text-[#E8F5E9] mb-4">
            碎碎念 / ARCHIVE LOGS
          </h1>
          <p className="text-[#A5D6B7] font-pixel opacity-80 tracking-wide text-sm md:text-base">
            OBSERVER NOTES // SYNCHRONIZING THOUGHTS
          </p>
        </header>

        {loading ? (
          <div className="font-pixel text-[#4ADE80] animate-pulse tracking-widest">
            LOADING DATA BLOCKS...
          </div>
        ) : posts.length === 0 ? (
          <div className="font-pixel text-[#4a6b57] tracking-widest">
            NO LOGS FOUND IN THE ARCHIVE.
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {posts.map((post) => (
              <article key={post.id} className="group border border-[#1B3B2B] p-6 hover:border-[#4ADE80]/50 transition-colors duration-300 bg-[#0a140f]/50 backdrop-blur-sm">
                <Link to={`/blog/${post.slug}`} className="block">
                  <time className="font-pixel text-[#4a6b57] text-xs tracking-widest mb-2 block">
                    {new Date(post.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit'
                    })} // SYSTEM TIME
                  </time>
                  <h2 className="text-xl md:text-2xl font-pixel tracking-wide text-[#A5D6B7] group-hover:text-[#4ADE80] transition-colors mb-4">
                    {post.title}
                  </h2>
                  
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.map((tag) => (
                        <span key={tag} className="bg-[#1B3B2B] text-[#4ADE80] px-2 py-0.5 text-[10px] font-pixel tracking-widest">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center text-[#4a6b57] group-hover:text-[#4ADE80] transition-colors font-pixel text-xs tracking-widest">
                    <span>ACCESS RECORD</span>
                    <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity transform -translate-x-2 group-hover:translate-x-0 duration-300">
                      →
                    </span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
      
      <CRTFilter />
    </div>
  );
}