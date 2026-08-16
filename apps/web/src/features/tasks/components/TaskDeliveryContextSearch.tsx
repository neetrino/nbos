'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, FolderKanban, Layers, LayoutGrid, Loader2, Plus, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  searchTaskDeliveryContext,
  type TaskDeliveryContextKind,
  type TaskDeliveryContextOption,
} from '../utils/search-task-delivery-context';

const SEARCH_DEBOUNCE_MS = 150;
const MAX_RESULTS = 24;

const KIND_ICON = {
  PROJECT: FolderKanban,
  PRODUCT: Layers,
  WORK_SPACE: LayoutGrid,
} as const;

const KIND_ICON_CLASS: Record<TaskDeliveryContextKind, string> = {
  PROJECT:
    'flex size-7 shrink-0 items-center justify-center rounded-md bg-sky-500/10 text-sky-700 dark:text-sky-300',
  PRODUCT:
    'flex size-7 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  WORK_SPACE:
    'flex size-7 shrink-0 items-center justify-center rounded-md bg-violet-500/10 text-violet-700 dark:text-violet-300',
};

const KIND_LABEL_CLASS: Record<TaskDeliveryContextKind, string> = {
  PROJECT: 'text-sky-700/80 dark:text-sky-300/80',
  PRODUCT: 'text-emerald-700/80 dark:text-emerald-300/80',
  WORK_SPACE: 'text-violet-700/80 dark:text-violet-300/80',
};

const KIND_LABEL: Record<TaskDeliveryContextKind, string> = {
  PROJECT: 'Project',
  PRODUCT: 'Product',
  WORK_SPACE: 'Work Space',
};

const NEST_PADDING: Record<0 | 1 | 2, string> = {
  0: 'pl-3',
  1: 'pl-8',
  2: 'pl-12',
};

interface TaskDeliveryContextSearchProps {
  disabled?: boolean;
  /** Encoded values already linked (`PROJECT:id` / `PRODUCT:id` / `WORK_SPACE:id`). */
  linkedValues: ReadonlySet<string>;
  onSelect: (option: TaskDeliveryContextOption) => void;
  className?: string;
  /** Closed-state trigger; `none` when the parent owns add via the border notch. */
  trigger?: 'button' | 'none';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/** Unified project / product / work space typeahead with nested rows. */
export function TaskDeliveryContextSearch({
  disabled = false,
  linkedValues,
  onSelect,
  className,
  trigger = 'button',
  open: openProp,
  onOpenChange,
}: TaskDeliveryContextSearchProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TaskDeliveryContextOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const runSearch = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        setResults(await searchTaskDeliveryContext(q, MAX_RESULTS / 3));
        setHighlightIdx(-1);
      } finally {
        setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    if (!open || disabled) return;
    runSearch('');
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [open, disabled, runSearch]);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled, setOpen]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open, setOpen]);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  function selectOption(option: TaskDeliveryContextOption) {
    if (linkedValues.has(option.value)) return;
    onSelect(option);
    setOpen(false);
    setQuery('');
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightIdx((idx) => Math.min(idx + 1, results.length - 1));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightIdx((idx) => Math.max(idx - 1, 0));
      return;
    }
    if (event.key === 'Enter' && highlightIdx >= 0) {
      const option = results[highlightIdx];
      if (option) {
        event.preventDefault();
        selectOption(option);
      }
    }
  }

  if (!open) {
    if (trigger === 'none') return null;
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={cn(
          'border-border/70 bg-background text-muted-foreground hover:border-border hover:text-foreground',
          'flex w-full min-w-0 items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors',
          'disabled:pointer-events-none disabled:opacity-50',
          className,
        )}
      >
        <Plus size={14} className="shrink-0" aria-hidden />
        <span className="truncate">Link project, product or work space…</span>
      </button>
    );
  }

  return (
    <div ref={containerRef} className={cn('relative w-full min-w-0', className)}>
      <div className="relative">
        <Search
          size={14}
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
        />
        <Input
          ref={inputRef}
          value={query}
          disabled={disabled}
          placeholder="Search projects, products & work spaces…"
          className="border-border rounded-xl pr-9 pl-9 text-sm"
          onChange={(event) => {
            setQuery(event.target.value);
            runSearch(event.target.value);
          }}
          onKeyDown={onKeyDown}
        />
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-1 flex size-7 -translate-y-1/2 items-center justify-center rounded-md"
          aria-label="Close search"
          onClick={() => {
            setOpen(false);
            setQuery('');
          }}
        >
          <X size={16} />
        </button>
      </div>

      <div className="border-border bg-popover absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded-xl border shadow-lg">
        <div className="max-h-64 overflow-y-auto">
          {loading ? (
            <div className="text-muted-foreground flex items-center gap-2 px-3 py-2.5 text-xs">
              <Loader2 size={13} className="animate-spin" />
              Searching…
            </div>
          ) : null}

          {!loading && results.length === 0 ? (
            <div className="text-muted-foreground px-3 py-2.5 text-xs">
              {query.trim()
                ? 'No results found'
                : 'Type to search projects, products and work spaces'}
            </div>
          ) : null}

          {!loading
            ? results.map((option, index) => {
                const linked = linkedValues.has(option.value);
                const Icon = KIND_ICON[option.kind];
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={linked}
                    onClick={() => selectOption(option)}
                    className={cn(
                      'flex w-full items-start gap-2 py-2 pr-3 text-left transition-colors',
                      NEST_PADDING[option.nestLevel],
                      index === highlightIdx && 'bg-muted',
                      linked ? 'cursor-default opacity-60' : 'hover:bg-muted',
                    )}
                  >
                    <span className={KIND_ICON_CLASS[option.kind]}>
                      <Icon size={14} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      {option.contextLabel ? (
                        <span className="text-muted-foreground block truncate text-[11px] leading-tight">
                          {option.contextLabel}
                        </span>
                      ) : null}
                      <span className="text-foreground block truncate text-sm font-medium">
                        {option.label}
                      </span>
                      <span
                        className={cn(
                          'mt-0.5 block text-[10px] font-medium tracking-wide uppercase',
                          KIND_LABEL_CLASS[option.kind],
                        )}
                      >
                        {KIND_LABEL[option.kind]}
                      </span>
                    </span>
                    {linked ? (
                      <Check
                        size={14}
                        className="text-muted-foreground mt-1 shrink-0"
                        aria-hidden
                      />
                    ) : null}
                  </button>
                );
              })
            : null}
        </div>
      </div>
    </div>
  );
}
