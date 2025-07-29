import React from 'react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
}

export default function Loader({ size = 'md' }: LoaderProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-[3px]',
    lg: 'h-8 w-8 border-4'
  };

  return (
    <div
      className={`inline-block animate-spin rounded-full border-solid border-current border-r-transparent ${sizeClasses[size]}`}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}