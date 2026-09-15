'use client';

import { useState, useRef, useEffect, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { SEARCH_FIELD_FOCUS_DELAY_MS } from '@/components/shared/search-field-query';
import { SearchFieldOpenPanel } from '@/components/shared/search-field-open-panel';
import { useSearchFieldQuery } from '@/components/shared/use-search-field-query';
import { SearchFieldClosedValue, type SearchOption } from './search-field-option';

const DEFAULT_MAX_RESULTS = 5;

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
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { results, loading, highlightIdx, setHighlightIdx, runSearch, cancelPending } =
    useSearchFieldQuery(onSearch, maxResults);

  useEffect(() => {
    if (!open || disabled) return;
    runSearch('');
    const focusTimer = window.setTimeout(
      () => inputRef.current?.focus(),
      SEARCH_FIELD_FOCUS_DELAY_MS,
    );
    return () => {
      cancelPending();
      window.clearTimeout(focusTimer);
    };
  }, [open, disabled, runSearch, cancelPending]);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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

  const handleKeyDown = (event: KeyboardEvent) => {
    if (disabled) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightIdx((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightIdx((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter' && highlightIdx >= 0 && results[highlightIdx]) {
      event.preventDefault();
      void handleSelect(results[highlightIdx].value, results[highlightIdx].label);
    } else if (event.key === 'Escape') {
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
        <SearchFieldOpenPanel
          query={query}
          placeholder={placeholder}
          disabled={disabled}
          loading={loading}
          results={results}
          highlightIdx={highlightIdx}
          saving={saving}
          newLabel={newLabel}
          onNew={onNew}
          inputRef={inputRef}
          onQueryChange={(next) => {
            setQuery(next);
            runSearch(next);
          }}
          onClearQuery={() => {
            setQuery('');
            runSearch('');
            inputRef.current?.focus();
          }}
          onKeyDown={handleKeyDown}
          onSelect={handleSelect}
          onClose={() => {
            setOpen(false);
            setQuery('');
          }}
        />
      ) : (
        <SearchFieldClosedValue
          label={label}
          value={value}
          displayValue={displayValue}
          placeholder={placeholder}
          hasValue={hasValue}
          disabled={disabled}
          saving={saving}
          newBadge={newBadge}
          onOpen={() => setOpen(true)}
          onClear={onClear ? handleClear : undefined}
        />
      )}
    </div>
  );
}
