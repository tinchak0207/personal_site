import { useState } from 'react';
import { TerminalBoot } from '../components/TerminalBoot';
import { Graph } from '../components/Graph';
import { CRTFilter } from '../components/CRTFilter';

export function Home() {
  const [booting, setBooting] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('booted') !== 'true';
    }
    return true;
  });

  const handleBootComplete = () => {
    sessionStorage.setItem('booted', 'true');
    setBooting(false);
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#030a07] overflow-hidden text-[#8FBC8F] select-none touch-none">
      {booting && <TerminalBoot onComplete={handleBootComplete} />}
      
      {!booting && (
        <div className="absolute inset-0">
          <Graph />
        </div>
      )}
      
      <CRTFilter />
    </div>
  );
}