import React, { memo } from 'react';

export const CRTFilter: React.FC = memo(() => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden mix-blend-screen">
      <div className="absolute inset-0 noise"></div>
      <div className="absolute inset-0 scanlines"></div>
      <div className="absolute inset-0 flicker bg-black/10"></div>
      <div className="absolute inset-0 vignette"></div>
    </div>
  );
});

CRTFilter.displayName = 'CRTFilter';