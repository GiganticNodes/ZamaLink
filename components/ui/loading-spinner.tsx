'use client';

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-[1.5px]',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-[3px]'
  };

  return (
    <div
      className={`${sizeClasses[size]} border-orange-400/30 border-t-orange-400 rounded-full animate-spin`}
      style={{ 
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        perspective: 1000
      }}
    />
  );
}