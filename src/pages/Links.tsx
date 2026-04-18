import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ExternalLink } from '../types';

export default function Links() {
  const [links, setLinks] = useState<ExternalLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLinks = async () => {
      const { data, error } = await supabase
        .from('external_links')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setLinks(data);
      }
      setLoading(false);
    };

    fetchLinks();
  }, []);

  return (
    <div className="min-h-screen bg-[#030a07] text-[#A5D6B7] font-mono p-6 selection:bg-[#4ADE80] selection:text-[#030a07] noise relative">
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex justify-between items-end mb-12 border-b-2 border-[#1B3B2B] pb-4">
          <div>
            <h1 className="text-4xl font-pixel text-[#FFCC80] tracking-widest">外部鏈接</h1>
            <p className="text-[#EF6C00] text-sm tracking-widest mt-2">/external_uplinks</p>
          </div>
          <Link to="/" className="text-[#4a6b57] hover:text-[#4ADE80] transition-colors font-pixel tracking-widest text-sm">
            [RETURN TO CORE]
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20 font-pixel text-[#4a6b57] animate-pulse">
            LOADING UPLINKS...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {links.map((link) => (
              <a 
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group border border-[#1B3B2B] bg-[#0a140f]/80 p-6 relative hover:border-[#FFCC80] transition-colors block"
              >
                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity text-[#FFCC80]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
                </div>
                
                <h2 className="text-xl font-pixel text-[#E8F5E9] mb-3 group-hover:text-[#FFCC80] transition-colors pr-6">
                  {link.title}
                </h2>
                
                {link.description && (
                  <p className="text-[#8FBC8F] text-sm mb-4 line-clamp-2">
                    {link.description}
                  </p>
                )}
                
                {link.tags && link.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-auto">
                    {link.tags.map(tag => (
                      <span key={tag} className="text-[10px] font-pixel text-[#E65100] bg-[#FFCC80]/10 px-2 py-1 border border-[#E65100]/30">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </a>
            ))}
            
            {links.length === 0 && (
              <div className="col-span-2 text-center py-20 border border-dashed border-[#1B3B2B] text-[#4a6b57] font-pixel">
                NO UPLINKS ESTABLISHED.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}