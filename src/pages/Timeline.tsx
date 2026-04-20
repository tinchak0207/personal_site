import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CRTFilter } from '../components/CRTFilter';
import { ExpandableSection } from '../components/ExpandableSection';
import { TimelineEvent } from '../types';
import ReactMarkdown from 'react-markdown';

export default function Timeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      const { data, error } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('published', true)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching timeline events:', error);
      } else {
        setEvents(data || []);
      }
      setLoading(false);
    }
    fetchEvents();
  }, []);

  // Generate static starfield
  const stars = useMemo(() => {
    return Array.from({ length: 200 }).map((_, i) => {
      const size = Math.random() > 0.8 ? Math.random() * 2 + 1 : Math.random() * 1.5 + 0.5;
      const opacity = Math.random() * 0.8 + 0.2;
      return {
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        width: `${size}px`,
        height: `${size}px`,
        opacity,
        animationDelay: `${Math.random() * 5}s`,
        animationDuration: `${Math.random() * 3 + 2}s`
      };
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030a07] text-[#4ADE80] font-pixel p-12 flex items-center justify-center">
        LOADING TIMELINE DATA...
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#030a07] text-[#8FBC8F] font-mono overflow-x-hidden selection:bg-[#4ADE80] selection:text-[#030a07]">
      {/* Starfield Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              left: star.left,
              top: star.top,
              width: star.width,
              height: star.height,
              opacity: star.opacity,
              animationDelay: star.animationDelay,
              animationDuration: star.animationDuration,
            }}
          />
        ))}
      </div>

      <div className="max-w-4xl mx-auto relative z-10 p-8 md:p-12 pb-24">
        <header className="mb-16 border-b border-[#1B3B2B] pb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-pixel tracking-widest text-[#E8F5E9] drop-shadow-[0_0_10px_rgba(74,222,128,0.3)]">
              ACHIEVEMENTS
            </h1>
            <p className="text-[#4a6b57] text-sm tracking-widest mt-3">/timeline</p>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/projects" className="text-[#81D4FA] hover:text-[#E8F5E9] transition-colors font-pixel tracking-widest text-sm">
              [RETURN TO PROJECTS]
            </Link>
            <Link to="/" className="text-[#4a6b57] hover:text-[#4ADE80] transition-colors font-pixel tracking-widest text-sm">
              [RETURN TO CORE]
            </Link>
          </div>
        </header>

        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[#1B3B2B] via-[#4ADE80]/30 to-[#1B3B2B] transform md:-translate-x-1/2"></div>

          {events.length === 0 ? (
            <div className="text-center py-20 border border-[#1B3B2B] bg-[#0a140f]/50">
              <p className="font-pixel text-[#4a6b57]">NO TIMELINE EVENTS FOUND.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {events.map((event, index) => {
                const isEven = index % 2 === 0;
                return (
                  <div key={event.id} className={`relative flex flex-col md:flex-row items-center justify-between group ${isEven ? 'md:flex-row-reverse' : ''}`}>
                    
                    {/* Node Dot on Timeline */}
                    <div className="absolute left-[-5px] md:left-1/2 top-6 md:top-8 w-3 h-3 bg-[#030a07] border-2 border-[#4ADE80] rounded-full transform md:-translate-x-1/2 z-10 shadow-[0_0_10px_rgba(74,222,128,0.5)] group-hover:scale-150 transition-transform group-hover:bg-[#4ADE80]"></div>

                    {/* Empty Space for the other side on desktop */}
                    <div className="hidden md:block md:w-5/12"></div>

                    {/* Content Card */}
                    <div className="w-full pl-8 md:pl-0 md:w-5/12 relative">
                      {/* Connection Line to Node */}
                      <div className={`hidden md:block absolute top-8 w-8 h-px bg-[#1B3B2B] group-hover:bg-[#4ADE80]/50 transition-colors ${isEven ? 'left-full' : 'right-full'}`}></div>

                      <div className="bg-[#0a140f]/80 backdrop-blur-sm border border-[#1B3B2B] p-6 hover:border-[#4ADE80]/50 transition-colors shadow-[0_4px_20px_rgba(0,0,0,0.5)] group-hover:shadow-[0_0_15px_rgba(74,222,128,0.15)]">
                        <div className="text-[#4ADE80] font-pixel text-xs tracking-widest mb-3 border-b border-[#1B3B2B] pb-2 inline-block">
                          {event.date}
                        </div>
                        
                        <h3 className="text-xl font-pixel text-[#E8F5E9] mb-4 leading-tight">
                          {event.link ? (
                            <a href={event.link} target="_blank" rel="noopener noreferrer" className="hover:text-[#4ADE80] transition-colors underline decoration-[#1B3B2B] hover:decoration-[#4ADE80] underline-offset-4">
                              {event.title}
                            </a>
                          ) : (
                            event.title
                          )}
                        </h3>

                        {event.image_url && (
                          <div className="mb-4 overflow-hidden border border-[#1B3B2B]">
                            <img 
                              src={event.image_url} 
                              alt={event.title} 
                              className="w-full h-auto object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-105 transform"
                            />
                          </div>
                        )}

                        {event.description && (
                          <ExpandableSection maxHeight={220} gradientFrom="from-[#0a140f]">
                            <div className="prose prose-invert prose-p:text-[#A5D6B7] prose-a:text-[#4ADE80] prose-a:no-underline hover:prose-a:underline prose-code:text-[#81D4FA] prose-code:bg-[#030a07] prose-code:px-1 prose-code:border prose-code:border-[#1B3B2B] prose-headings:text-[#E8F5E9] prose-headings:font-pixel text-sm">
                              <ReactMarkdown>{event.description}</ReactMarkdown>
                            </div>
                          </ExpandableSection>
                        )}

                        {event.tags && event.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-[#1B3B2B]">
                            {event.tags.map((tag) => (
                              <span key={tag} className="text-[10px] font-pixel text-[#4a6b57] bg-[#030a07] border border-[#1B3B2B] px-2 py-1">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <CRTFilter />
    </div>
  );
}
