'use client';

import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'h-4 w-4 border',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-2',
};

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div className="flex items-center justify-center py-20">
      <div
        className={cn(
          'border-accent animate-spin rounded-full border-t-transparent',
          SIZE_CLASSES[size],
          className,
        )}
      />
    </div>
  );
}
