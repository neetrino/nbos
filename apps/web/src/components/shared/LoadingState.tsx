'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const DEFAULT_ITEM_COUNT = 5;

interface LoadingStateProps {
  variant?: 'list' | 'cards';
  count?: number;
  className?: string;
}

export function LoadingState({
  variant = 'list',
  count = DEFAULT_ITEM_COUNT,
  className,
}: LoadingStateProps) {
  const items = Array.from({ length: count });

  if (variant === 'cards') {
    return (
      <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3', className)}>
        {items.map((_, index) => (
          <Skeleton key={index} className="h-48 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {items.map((_, index) => (
        <Skeleton key={index} className="h-14 w-full rounded-lg" />
      ))}
    </div>
  );
}
