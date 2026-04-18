import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Project } from '../types';

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setProjects(data);
      }
      setLoading(false);
    };

    fetchProjects();
  }, []);

  return (
    <div className="min-h-screen bg-[#030a07] text-[#A5D6B7] font-mono p-6 selection:bg-[#4ADE80] selection:text-[#030a07] noise relative">
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex justify-between items-end mb-12 border-b-2 border-[#1B3B2B] pb-4">
          <div>
            <h1 className="text-4xl font-pixel text-[#81D4FA] tracking-widest">個人項目</h1>
            <p className="text-[#0277BD] text-sm tracking-widest mt-2">/projects</p>
          </div>
          <Link to="/" className="text-[#4a6b57] hover:text-[#4ADE80] transition-colors font-pixel tracking-widest text-sm">
            [RETURN TO CORE]
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20 font-pixel text-[#4a6b57] animate-pulse">
            LOADING PROJECTS...
          </div>
        ) : (
          <div className="grid gap-8">
            {projects.map((project) => (
              <div 
                key={project.id}
                className="group border border-[#1B3B2B] bg-[#0a140f]/80 p-8 relative hover:border-[#81D4FA] transition-colors"
              >
                <div className="absolute top-0 right-0 border-b border-l border-[#1B3B2B] px-3 py-1 bg-[#030a07] text-[#0277BD] font-pixel text-[10px] tracking-widest">
                  {new Date(project.created_at).toLocaleDateString()}
                </div>
                
                <h2 className="text-2xl font-pixel text-[#E8F5E9] mb-4 group-hover:text-[#81D4FA] transition-colors">
                  {project.title}
                </h2>
                
                <div className="prose prose-invert prose-p:text-[#8FBC8F] prose-a:text-[#81D4FA] prose-a:no-underline hover:prose-a:underline mb-6 max-w-none">
                  {/* Basic markdown rendering for now, could integrate react-markdown later */}
                  {project.description.split('\n').map((line, i) => (
                    <p key={i} className="mb-2">{line}</p>
                  ))}
                </div>
                
                <div className="flex flex-wrap gap-4 items-center mt-6 pt-6 border-t border-[#1B3B2B]/50">
                  {project.url && (
                    <a href={project.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#81D4FA] hover:text-[#B3E5FC] transition-colors font-pixel text-xs border border-[#0277BD] px-3 py-1.5 bg-[#01579B]/20">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                      LIVE DEMO
                    </a>
                  )}
                  {project.github_url && (
                    <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#A5D6B7] hover:text-[#E8F5E9] transition-colors font-pixel text-xs border border-[#1B3B2B] px-3 py-1.5 bg-[#030a07]">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
                      SOURCE CODE
                    </a>
                  )}
                  
                  <div className="ml-auto flex gap-2">
                    {(project.tags || []).map(tag => (
                      <span key={tag} className="text-[10px] font-pixel text-[#0277BD] bg-[#81D4FA]/10 px-2 py-1 border border-[#0277BD]/30">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            
            {projects.length === 0 && (
              <div className="text-center py-20 border border-dashed border-[#1B3B2B] text-[#4a6b57] font-pixel">
                NO PROJECTS INITIALIZED.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}