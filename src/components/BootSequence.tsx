import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';

const bootMessages = [
  'COGNITIVE KERNEL [Version 1.0.0]',
  '(c) Digital Hatch Corporation. All rights reserved.',
  '',
  'INIT_SEQUENCE_START...',
  'LOADING MEMORY_BANKS: OK',
  'MOUNTING VFS: OK',
  'ESTABLISHING SYNAPTIC_LINKS...',
  'WARNING: CHAOTIC_ENTANGLEMENT_DETECTED',
  'RESOLVING ADDR_0x0A1 (INFP): OK',
  'RESOLVING ADDR_0x0A2 (AI Native): OK',
  'RESOLVING ADDR_0x0A4 (ADHD): OK',
  'BOOTING VISUAL_INTERFACE...',
  'ENTERING ZERO_GRAVITY_MODE...',
  'DONE.'
];

export function BootSequence() {
  const [lines, setLines] = useState<string[]>([]);
  const completeBoot = useStore(state => state.completeBoot);

  useEffect(() => {
    let currentLine = 0;
    let isCancelled = false;

    const addLine = () => {
      if (isCancelled) return;
      if (currentLine < bootMessages.length) {
        setLines(prev => [...prev, bootMessages[currentLine]]);
        currentLine++;
        setTimeout(addLine, Math.random() * 150 + 50); // random delay for terminal feel
      } else {
        setTimeout(() => {
          if (!isCancelled) completeBoot();
        }, 800);
      }
    };

    setTimeout(addLine, 500);

    return () => {
      isCancelled = true;
    };
  }, [completeBoot]);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-start justify-start p-8 bg-black text-[#00FF41] font-mono text-sm md:text-base pointer-events-none">
      {lines.map((line, i) => (
        <div key={i} className="mb-1 leading-relaxed">
          {line}
        </div>
      ))}
      <div className="animate-pulse w-3 h-5 bg-[#00FF41] mt-1" />
    </div>
  );
}
