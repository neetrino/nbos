'use client';

import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { Search, X, Plus, Pencil, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  DETAIL_SHEET_FIELD_CLEAR_BTN_CLASS,
  DETAIL_SHEET_FIELD_PENCIL_ICON_CLASS,
  DETAIL_SHEET_FIELD_SHELL_GROUP_CLASS,
} from './detail-sheet-classes';

const DEFAULT_MAX_RESULTS = 5;

interface SearchOption {
  value: string;
  label: string;
  subtitle?: string;
}

interface SearchFieldBaseProps {
  label: string;
  value: string | null | undefined;
  displayValue?: ReactNode;
  placeholder?: string;
  icon?: ReactNode;
  onSearch: (query: string) => Promise<SearchOption[]>;
  onClear?: () => Promise<void> | void | (() => void);
  onNew?: () => void;
  newLabel?: string;
  newBadge?: ReactNode;
  className?: string;
  disabled?: boolean;
  /** Max rows shown in the dropdown (default 5). */
  maxResults?: number;
}

type SearchFieldPersistProps = SearchFieldBaseProps & {
  selectionMode?: 'persist';
  onSave: (value: string, label: string) => Promise<void> | void;
};

type SearchFieldStageProps = SearchFieldBaseProps & {
  selectionMode: 'stage';
  onStageSelect: (value: string, label: string) => void;
  onClear?: () => void;
};

export type SearchFieldProps = SearchFieldPersistProps | SearchFieldStageProps;

/**
 * Generic async search + optional inline “new” action.
 *
 * For **entity links** (Contact, Company, Project, Partner, Product, Employee) use
 * {@link RelationPickerField} with {@link useRelationPickerActions} and app-wide
 * {@link EntityRelationHost} instead — unified search, create bar, chip open, and clear.
 *
 * Keep `SearchField` for non-entity cases: Drive file pickers, composite ids (e.g. marketing
 * attribution `ACCOUNT:id`), filters, and legacy screens not yet migrated.
 */
function isStageProps(props: SearchFieldProps): props is SearchFieldStageProps {
  return props.selectionMode === 'stage';
}

export function SearchField(props: SearchFieldProps) {
  const {
    label,
    value,
    displayValue,
    placeholder,
    icon,
    onSearch,
    onClear,
    onNew,
    newLabel = 'Create new',
    newBadge,
    className,
    disabled = false,
    maxResults = DEFAULT_MAX_RESULTS,
  } = props;
  const onSave = isStageProps(props) ? undefined : props.onSave;
  const onStageSelect = isStageProps(props) ? props.onStageSelect : undefined;
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
          setResults(items.slice(0, maxResults));
          setHighlightIdx(-1);
        } finally {
          setLoading(false);
        }
      }, 150);
    },
    [onSearch, maxResults],
  );

  useEffect(() => {
    if (open && !disabled) {
      doSearch('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [open, disabled, doSearch]);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

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
    if (disabled) return;
    if (isStageProps(props) && onStageSelect) {
      onStageSelect(optValue, optLabel);
      setOpen(false);
      setQuery('');
      return;
    }
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(optValue, optLabel);
    } finally {
      setSaving(false);
      setOpen(false);
      setQuery('');
    }
  };

  const handleClear = async () => {
    if (disabled || !onClear) return;
    setOpen(false);
    setQuery('');
    if (isStageProps(props)) {
      onClear();
      return;
    }
    setSaving(true);
    try {
      await onClear();
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
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
    <div
      className={cn('group relative', disabled && 'pointer-events-none opacity-60', className)}
      ref={containerRef}
    >
      <div className="text-foreground/85 mb-1.5 flex items-center gap-1.5 text-sm font-medium">
        {icon && <span className="text-muted-foreground/70">{icon}</span>}
        {label}
      </div>

      {open ? (
        <div className="relative">
          <div className="relative">
            <Search
              size={14}
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
            />
            <Input
              ref={inputRef}
              value={query}
              disabled={disabled}
              onChange={(e) => {
                setQuery(e.target.value);
                doSearch(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder ?? 'Type to search...'}
              className="pr-9 pl-9 text-sm"
            />
            {query && (
              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onClick={() => {
                  setQuery('');
                  doSearch('');
                  inputRef.current?.focus();
                }}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-1 flex size-7 -translate-y-1/2 items-center justify-center rounded-md"
              >
                <X size={16} />
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
            onClick={() => {
              if (!disabled) setOpen(true);
            }}
            className={cn(
              DETAIL_SHEET_FIELD_SHELL_GROUP_CLASS,
              'border-border/60 bg-muted/20 text-foreground flex-1 rounded-xl border px-3 py-2 text-sm shadow-sm shadow-black/[0.04] transition-[border-color,box-shadow,background-color]',
              disabled
                ? 'cursor-not-allowed opacity-60'
                : 'hover:border-border hover:bg-muted/30 dark:border-border/50 dark:bg-input/35 dark:hover:bg-input/45 cursor-pointer',
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
              <div className="flex items-center gap-1">
                {onClear && hasValue ? (
                  <button
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleClear();
                    }}
                    disabled={saving}
                    className={DETAIL_SHEET_FIELD_CLEAR_BTN_CLASS}
                    aria-label={`Clear ${label}`}
                  >
                    <X size={16} />
                  </button>
                ) : null}
                <Pencil size={16} className={DETAIL_SHEET_FIELD_PENCIL_ICON_CLASS} aria-hidden />
              </div>
            </div>
          </div>
          {newBadge}
        </div>
      )}
    </div>
  );
}
