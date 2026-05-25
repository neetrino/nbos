'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  HEADER_SEARCH_FIELD_WIDTH_REM,
  HEADER_SEARCH_ICON_SIZE_REM,
} from '@/components/layout/header-search-button-constants';

export function HeaderSearchButton() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
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

  const widthRem = open ? HEADER_SEARCH_FIELD_WIDTH_REM : HEADER_SEARCH_ICON_SIZE_REM;

  return (
    <div ref={rootRef} className="flex min-w-0 justify-end">
      <div
        style={{
          width: `${widthRem}rem`,
          maxWidth: open ? 'min(20rem, calc(100vw - 8rem))' : undefined,
        }}
        className={cn(
          'bg-secondary/90 border-border/50 inline-flex h-9 shrink-0 items-center overflow-hidden rounded-full border shadow-sm transition-[width] duration-200 ease-out',
          open ? 'gap-2 px-3' : 'justify-center',
        )}
      >
        {open ? (
          <>
            <Search
              size={15}
              strokeWidth={1.75}
              className="text-muted-foreground shrink-0 opacity-80"
              aria-hidden
            />
            <input
              ref={inputRef}
              id={inputId}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              aria-label="Search"
              className="text-foreground placeholder:text-muted-foreground min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
            />
            <kbd className="border-border bg-background text-muted-foreground hidden shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-medium sm:inline">
              ⌘K
            </kbd>
          </>
        ) : (
          <button
            type="button"
            aria-expanded={false}
            aria-controls={inputId}
            aria-label="Search"
            onClick={() => setOpen(true)}
            className="text-muted-foreground hover:text-foreground inline-flex size-full items-center justify-center transition-colors"
          >
            <Search size={18} strokeWidth={1.75} aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
