import { useState, useEffect } from 'react';
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

  const [graphReady, setGraphReady] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready.then(() => {
        setFontsReady(true);
      });
    } else {
      setFontsReady(true);
    }
  }, []);

  const handleBootComplete = () => {
    sessionStorage.setItem('booted', 'true');
    setBooting(false);
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#030a07] overflow-hidden text-[#8FBC8F] select-none touch-none">
      {/* Always render Graph in the background so it initializes without stuttering the transition */}
      <div className="absolute inset-0 z-0">
        <Graph onReady={() => setGraphReady(true)} isBooting={booting} />
      </div>

      {booting && (
        <TerminalBoot 
          onComplete={handleBootComplete} 
          isReady={graphReady && fontsReady} 
        />
      )}
      
      <CRTFilter />
    </div>
  );
}