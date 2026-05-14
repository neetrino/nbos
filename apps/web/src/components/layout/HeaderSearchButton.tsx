'use client';

import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  HEADER_SEARCH_PILL_WIDTH_COLLAPSED_REM,
  HEADER_SEARCH_PILL_WIDTH_EXPANDED_REM,
} from '@/components/layout/header-search-button-constants';

export function HeaderSearchButton() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const widthRem = open
    ? HEADER_SEARCH_PILL_WIDTH_EXPANDED_REM
    : HEADER_SEARCH_PILL_WIDTH_COLLAPSED_REM;

  return (
    <div ref={rootRef} className="flex min-w-0 justify-start">
      <button
        type="button"
        aria-expanded={open}
        aria-label="Search"
        onClick={() => setOpen((was) => !was)}
        style={{
          width: `${widthRem}rem`,
          maxWidth: 'calc(100vw - 6rem)',
        }}
        className={cn(
          'bg-secondary/90 text-muted-foreground border-border/50 hover:bg-secondary inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm shadow-sm transition-[width] duration-200 ease-out',
        )}
      >
        <Search size={15} strokeWidth={1.75} className="shrink-0 opacity-80" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-left">Search...</span>
        <kbd className="border-border bg-background text-muted-foreground hidden shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-medium sm:inline">
          ⌘K
        </kbd>
      </button>
    </div>
  );
}
