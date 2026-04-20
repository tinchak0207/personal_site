export function CRTEffects() {
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden select-none">
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.8)_100%)] opacity-80 mix-blend-multiply" />
      
      {/* Scanlines */}
      <div 
        className="absolute inset-0 opacity-[0.15]" 
        style={{
          backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
          backgroundSize: '100% 2px, 3px 100%',
          zIndex: 999
        }}
      />

      {/* Flicker Animation */}
      <style>{`
        @keyframes crt-flicker {
          0% { opacity: 0.98; }
          5% { opacity: 0.95; }
          10% { opacity: 0.9; }
          15% { opacity: 0.95; }
          100% { opacity: 1; }
        }
        .crt-flicker-layer {
          animation: crt-flicker 0.15s infinite;
        }
      `}</style>
      <div className="absolute inset-0 crt-flicker-layer bg-black opacity-0 mix-blend-overlay" />
    </div>
  );
}
