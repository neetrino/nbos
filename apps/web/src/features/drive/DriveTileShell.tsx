'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function DriveTileShell({
  title,
  subtitle,
  icon,
  onClick,
  className,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'border-border/80 bg-muted/30 hover:bg-muted/50 focus-visible:ring-ring flex h-auto w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-colors outline-none focus-visible:ring-2',
        className,
      )}
    >
      <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-foreground line-clamp-2 text-sm leading-snug font-medium">
          {title}
        </span>
        <span className="text-muted-foreground mt-0.5 block truncate text-[11px] tracking-wide uppercase">
          {subtitle}
        </span>
      </span>
    </button>
  );
}
