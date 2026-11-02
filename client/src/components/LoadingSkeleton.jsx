import React from 'react';

export default function LoadingSkeleton({ count = 3, height = 'h-16', className = '' }) {
  return (
    <div className={`space-y-3 w-full animate-pulse ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`w-full ${height} bg-slate-200 dark:bg-darkSurface-subtle/80 rounded-xl`}
        />
      ))}
    </div>
  );
}

export function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3'
  };

  return (
    <div
      className={`inline-block animate-spin rounded-full border-solid border-bwu-700 dark:border-red-500 border-r-transparent ${sizes[size]} ${className}`}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
