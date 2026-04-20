import React, { useState, useRef, useEffect, ReactNode } from 'react';

interface ExpandableSectionProps {
  children: ReactNode;
  maxHeight?: number;
  className?: string;
  gradientFrom?: string;
}

export function ExpandableSection({ 
  children, 
  maxHeight = 220, 
  className = '',
  gradientFrom = 'from-[#0a140f]'
}: ExpandableSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkOverflow = () => {
      if (contentRef.current) {
        setIsOverflowing(contentRef.current.scrollHeight > maxHeight);
      }
    };

    checkOverflow();
    
    const resizeObserver = new ResizeObserver(() => {
      checkOverflow();
    });
    
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }
    
    return () => resizeObserver.disconnect();
  }, [maxHeight, children]);

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={contentRef}
        className={`overflow-hidden transition-[max-height] duration-500 ease-in-out ${isExpanded ? '' : 'relative'}`}
        style={{ 
          maxHeight: isExpanded ? `${contentRef.current?.scrollHeight || 10000}px` : `${maxHeight}px` 
        }}
      >
        {children}
        
        {!isExpanded && isOverflowing && (
          <div className={`absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t ${gradientFrom} to-transparent pointer-events-none`} />
        )}
      </div>
      
      {isOverflowing && (
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }}
          className="mt-3 text-[10px] md:text-xs font-pixel tracking-widest text-[#4a6b57] hover:text-[#4ADE80] transition-colors border border-[#1B3B2B] px-3 py-2 bg-[#030a07] hover:border-[#4ADE80]/50 w-full text-center flex justify-center items-center gap-2 group"
        >
          {isExpanded ? (
            <>
              <span className="group-hover:text-[#E8F5E9]">[ COLLAPSE ]</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6"/></svg>
            </>
          ) : (
            <>
              <span className="group-hover:text-[#E8F5E9]">[ EXPAND TO READ MORE ]</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
            </>
          )}
        </button>
      )}
    </div>
  );
}
