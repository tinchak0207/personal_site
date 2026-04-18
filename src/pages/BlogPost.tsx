import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { supabase } from '../lib/supabase';
import { CRTFilter } from '../components/CRTFilter';

interface PostDetail {
  title: string;
  content: string;
  created_at: string;
  tags?: string[];
}

export function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPost() {
      const { data, error } = await supabase
        .from('posts')
        .select('title, content, created_at, tags')
        .eq('slug', slug)
        .single();

      if (error) {
        console.error('Error fetching post:', error);
      } else {
        setPost(data);
      }
      setLoading(false);
    }

    if (slug) {
      fetchPost();
    }
  }, [slug]);

  return (
    <div className="relative min-h-screen bg-[#030a07] text-[#8FBC8F] font-mono p-8 md:p-24 selection:bg-[#4ADE80] selection:text-[#030a07] overflow-x-hidden">
      <div className="max-w-3xl mx-auto relative z-10">
        <header className="mb-12 border-b border-[#1B3B2B] pb-8">
          <Link to="/blog" className="inline-block mb-8 text-[#4a6b57] hover:text-[#4ADE80] transition-colors font-pixel tracking-widest text-sm">
            {'< BACK TO ARCHIVE'}
          </Link>
          
          {loading ? (
            <div className="font-pixel text-[#4ADE80] animate-pulse tracking-widest">
              DECRYPTING LOG...
            </div>
          ) : post ? (
            <>
              <h1 className="text-3xl md:text-5xl font-pixel tracking-wider text-[#E8F5E9] mb-4">
                {post.title}
              </h1>

              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {post.tags.map((tag) => (
                    <span key={tag} className="bg-[#1B3B2B] text-[#4ADE80] px-2 py-0.5 text-xs font-pixel tracking-widest">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <time className="font-pixel text-[#4a6b57] text-xs tracking-widest block">
                LOG ENTRY DATE // {new Date(post.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit'
                })}
              </time>
            </>
          ) : (
            <div className="font-pixel text-[#4a6b57] tracking-widest">
              LOG NOT FOUND OR CORRUPTED.
            </div>
          )}
        </header>

        {!loading && post && (
          <article className="font-mono">
            <ReactMarkdown
              components={{
                h1: ({node, ...props}) => <h1 className="font-pixel text-3xl text-[#E8F5E9] tracking-wider mt-12 mb-6" {...props} />,
                h2: ({node, ...props}) => <h2 className="font-pixel text-2xl text-[#A5D6B7] tracking-wider mt-10 mb-4" {...props} />,
                h3: ({node, ...props}) => <h3 className="font-pixel text-xl text-[#8FBC8F] tracking-wide mt-8 mb-4" {...props} />,
                p: ({node, ...props}) => <p className="text-[#8FBC8F] leading-relaxed mb-6 opacity-90" {...props} />,
                a: ({node, ...props}) => <a className="text-[#4ADE80] hover:text-[#E8F5E9] underline decoration-[#1B3B2B] underline-offset-4 transition-colors" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc list-inside mb-6 text-[#8FBC8F] opacity-90" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-6 text-[#8FBC8F] opacity-90" {...props} />,
                li: ({node, ...props}) => <li className="mb-2" {...props} />,
                blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-[#4ADE80] pl-6 italic text-[#A5D6B7] bg-[#0a140f]/30 py-4 pr-4 my-6" {...props} />,
                img: ({node, ...props}) => <img className="max-w-full h-auto border border-[#1B3B2B] rounded shadow-[0_0_15px_rgba(27,59,43,0.5)] my-8" loading="lazy" {...props} />,
                code: ({node, inline, className, children, ...props}: any) => 
                  inline 
                    ? <code className="bg-[#1B3B2B]/50 text-[#E8F5E9] px-1.5 py-0.5 rounded font-pixel text-sm" {...props}>{children}</code>
                    : <code className="block bg-[#0a140f] border border-[#1B3B2B] p-4 rounded text-[#A5D6B7] overflow-x-auto font-mono text-sm my-6" {...props}>{children}</code>,
              }}
            >
              {post.content}
            </ReactMarkdown>
          </article>
        )}
      </div>
      
      <CRTFilter />
    </div>
  );
}