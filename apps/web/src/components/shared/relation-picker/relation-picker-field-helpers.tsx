'use client';

import { useEffect, type MutableRefObject, type ReactNode, type RefObject } from 'react';
import { Plus } from 'lucide-react';

export function RelationPickerHeader({
  label,
  icon,
  showAdd,
  addAriaLabel,
  disabled,
  onAdd,
}: {
  label: string;
  icon?: ReactNode;
  showAdd: boolean;
  addAriaLabel: string;
  disabled: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="text-foreground/85 mb-1.5 flex h-5 items-center justify-between gap-2 text-sm font-medium">
      {label.trim() || icon ? (
        <div className="flex min-w-0 items-center gap-1.5">
          {icon ? <span className="text-muted-foreground/70 shrink-0">{icon}</span> : null}
          {label.trim() ? <span className="truncate">{label}</span> : null}
        </div>
      ) : (
        <span aria-hidden />
      )}
      {showAdd ? (
        <button
          type="button"
          disabled={disabled}
          onClick={onAdd}
          className="text-muted-foreground hover:text-foreground hover:bg-muted/40 flex size-5 shrink-0 items-center justify-center rounded-md transition-colors"
          aria-label={addAriaLabel}
        >
          <Plus size={14} />
        </button>
      ) : null}
    </div>
  );
}

export function useRelationPickerOpenEffects({
  open,
  disabled,
  doSearch,
  containerRef,
  inputRef,
  debounceRef,
  setOpen,
  setQuery,
}: {
  open: boolean;
  disabled: boolean;
  doSearch: (q: string) => void;
  containerRef: RefObject<HTMLDivElement | null>;
  inputRef: RefObject<HTMLInputElement | null>;
  debounceRef: MutableRefObject<ReturnType<typeof setTimeout> | undefined>;
  setOpen: (open: boolean) => void;
  setQuery: (query: string) => void;
}): void {
  useEffect(() => {
    if (open && !disabled) {
      doSearch('');
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
    const pendingSearch = debounceRef.current;
    return () => {
      if (pendingSearch) clearTimeout(pendingSearch);
    };
  }, [open, disabled, doSearch, debounceRef, inputRef]);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled, setOpen]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, containerRef, setOpen, setQuery]);
}
