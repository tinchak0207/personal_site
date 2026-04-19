import React from 'react';

export const CRTFilter: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden mix-blend-screen transform-gpu will-change-transform">
      <div className="absolute inset-0 noise transform-gpu"></div>
      <div className="absolute inset-0 scanlines"></div>
      <div className="absolute inset-0 flicker bg-black/10"></div>
      <div className="absolute inset-0 vignette"></div>
    </div>
  );
};