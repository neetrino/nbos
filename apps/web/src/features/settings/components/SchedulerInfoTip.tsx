'use client';

import type { ReactNode } from 'react';
import { Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export function SchedulerInfoTip(props: {
  label: string;
  children: ReactNode;
  className?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}) {
  const { label, children, className, side = 'bottom' } = props;
  return (
    <Popover>
      <PopoverTrigger
        aria-label={label}
        className={cn(
          'text-muted-foreground hover:text-foreground hover:bg-muted/80 inline-flex size-6 shrink-0 items-center justify-center rounded-full transition-colors outline-none',
          'focus-visible:ring-ring/50 focus-visible:ring-2',
          className,
        )}
      >
        <Info className="size-3.5" aria-hidden />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side={side}
        className="border-border bg-popover w-72 rounded-xl p-3 text-sm shadow-lg"
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}
