'use client';

export function BackgroundEffects() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Static blur spots */}
      <div className="accent-blur w-72 h-72 top-20 -left-36" />
      
      <div className="accent-blur w-96 h-96 top-1/2 right-0" />
      
      <div className="bg-orange-200/30 blur-3xl w-80 h-80 bottom-20 left-1/4" />
      
    </div>
  );
}