'use client';

import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { Search, X, Plus, Pencil, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const MAX_RESULTS = 5;

interface SearchOption {
  value: string;
  label: string;
  subtitle?: string;
}

interface SearchFieldProps {
  label: string;
  value: string | null | undefined;
  displayValue?: ReactNode;
  placeholder?: string;
  icon?: ReactNode;
  onSave: (value: string, label: string) => Promise<void> | void;
  onSearch: (query: string) => Promise<SearchOption[]>;
  onNew?: () => void;
  newLabel?: string;
  newBadge?: ReactNode;
  className?: string;
}

export function SearchField({
  label,
  value,
  displayValue,
  placeholder,
  icon,
  onSave,
  onSearch,
  onNew,
  newLabel = 'Create new',
  newBadge,
  className,
}: SearchFieldProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const doSearch = useCallback(
    (q: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        setLoading(true);
        try {
          const items = await onSearch(q);
          setResults(items.slice(0, MAX_RESULTS));
          setHighlightIdx(-1);
        } finally {
          setLoading(false);
        }
      }, 150);
    },
    [onSearch],
  );

  useEffect(() => {
    if (open) {
      doSearch('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [open, doSearch]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSelect = async (optValue: string, optLabel: string) => {
    setSaving(true);
    try {
      await onSave(optValue, optLabel);
    } finally {
      setSaving(false);
      setOpen(false);
      setQuery('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && highlightIdx >= 0 && results[highlightIdx]) {
      e.preventDefault();
      handleSelect(results[highlightIdx].value, results[highlightIdx].label);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const hasValue = value != null && value !== '';

  return (
    <div className={cn('group relative', className)} ref={containerRef}>
      <div className="text-muted-foreground mb-1 flex items-center gap-1.5 text-xs font-medium">
        {icon && <span className="text-muted-foreground/70">{icon}</span>}
        {label}
      </div>

      {open ? (
        <div className="relative">
          <div className="relative">
            <Search
              size={14}
              className="text-muted-foreground absolute top-1/2 left-2.5 -translate-y-1/2"
            />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                doSearch(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder ?? 'Type to search...'}
              className="h-8 pr-8 pl-8 text-sm"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  doSearch('');
                  inputRef.current?.focus();
                }}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="absolute inset-x-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-stone-200 bg-white shadow-lg dark:border-stone-700 dark:bg-stone-900">
            {loading && (
              <div className="text-muted-foreground flex items-center gap-2 px-3 py-2.5 text-xs">
                <Loader2 size={13} className="animate-spin" />
                Searching...
              </div>
            )}

            {!loading && results.length === 0 && query && (
              <div className="text-muted-foreground px-3 py-2.5 text-xs">No results found</div>
            )}

            {!loading &&
              results.map((opt, i) => (
                <button
                  key={opt.value}
                  onClick={() => handleSelect(opt.value, opt.label)}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-stone-50 dark:hover:bg-stone-800',
                    i === highlightIdx && 'bg-stone-50 dark:bg-stone-800',
                    saving && 'pointer-events-none opacity-50',
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate text-sm font-medium">{opt.label}</p>
                    {opt.subtitle && (
                      <p className="text-muted-foreground truncate text-[11px]">{opt.subtitle}</p>
                    )}
                  </div>
                </button>
              ))}

            {onNew && (
              <button
                onClick={() => {
                  onNew();
                  setOpen(false);
                  setQuery('');
                }}
                className="flex w-full items-center gap-2 border-t border-stone-100 px-3 py-2 text-left text-sm font-medium text-amber-600 transition-colors hover:bg-amber-50 dark:border-stone-800 dark:text-amber-400 dark:hover:bg-amber-950/20"
              >
                <Plus size={14} />
                {newLabel}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div
            onClick={() => setOpen(true)}
            className={cn(
              'flex-1 cursor-pointer rounded-lg border border-transparent px-3 py-2 text-sm transition-all',
              'hover:bg-accent/5 hover:border-border',
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {displayValue ??
                  (hasValue ? (
                    <span className="text-foreground">{value}</span>
                  ) : (
                    <span className="text-muted-foreground">{placeholder ?? 'Not set'}</span>
                  ))}
              </div>
              <Pencil
                size={12}
                className="text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-all"
              />
            </div>
          </div>
          {newBadge}
        </div>
      )}
    </div>
  );
}
