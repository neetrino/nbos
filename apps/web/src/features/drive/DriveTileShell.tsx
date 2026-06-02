'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function DriveTileShell({
  title,
  subtitle,
  subtitleTrailing,
  icon,
  onClick,
  className,
}: {
  title: string;
  subtitle: string;
  /** Shown on the right of the subtitle row (e.g. record code in Tiles view). */
  subtitleTrailing?: string;
  icon: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'border-border/60 bg-card/90 hover:border-primary/25 hover:bg-card focus-visible:ring-ring flex h-auto w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left shadow-sm transition-colors outline-none focus-visible:ring-2',
        className,
      )}
    >
      <span className="border-border/60 bg-muted/30 text-foreground/80 flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-foreground line-clamp-2 text-sm leading-snug font-medium">
          {title}
        </span>
        <span className="text-muted-foreground mt-0.5 flex min-w-0 items-center justify-between gap-2 text-[11px] tracking-wide uppercase">
          <span className="truncate">{subtitle}</span>
          {subtitleTrailing ? (
            <span className="text-muted-foreground shrink-0 font-mono text-[10px] leading-none font-normal normal-case">
              {subtitleTrailing}
            </span>
          ) : null}
        </span>
      </span>
    </button>
  );
}
