'use client';

import type { KeyboardEvent, RefObject } from 'react';
import { Search, X, Plus, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  SearchFieldOptionButton,
  type SearchOption,
} from '@/components/shared/search-field-option';

type SearchFieldOpenPanelProps = {
  query: string;
  placeholder?: string;
  disabled: boolean;
  loading: boolean;
  results: SearchOption[];
  highlightIdx: number;
  saving: boolean;
  newLabel: string;
  onNew?: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
  onQueryChange: (query: string) => void;
  onClearQuery: () => void;
  onKeyDown: (event: KeyboardEvent) => void;
  onSelect: (value: string, label: string) => void;
  onClose: () => void;
};

export function SearchFieldOpenPanel({
  query,
  placeholder,
  disabled,
  loading,
  results,
  highlightIdx,
  saving,
  newLabel,
  onNew,
  inputRef,
  onQueryChange,
  onClearQuery,
  onKeyDown,
  onSelect,
  onClose,
}: SearchFieldOpenPanelProps) {
  const showSpinner = loading && results.length === 0;
  const showEmpty = !loading && results.length === 0 && Boolean(query);

  return (
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
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder ?? 'Type to search...'}
          className="pr-9 pl-9 text-sm"
        />
        {query ? (
          <button
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={onClearQuery}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-1 flex size-7 -translate-y-1/2 items-center justify-center rounded-md"
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

      <div className="border-border bg-popover absolute inset-x-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border shadow-lg">
        {showSpinner ? (
          <div className="text-muted-foreground flex items-center gap-2 px-3 py-2.5 text-xs">
            <Loader2 size={13} className="animate-spin" />
            Searching...
          </div>
        ) : null}
        {showEmpty ? (
          <div className="text-muted-foreground px-3 py-2.5 text-xs">No results found</div>
        ) : null}
        {results.map((opt, index) => (
          <SearchFieldOptionButton
            key={opt.value}
            option={opt}
            highlighted={index === highlightIdx}
            saving={saving}
            onSelect={onSelect}
          />
        ))}
        {onNew ? (
          <button
            type="button"
            onClick={() => {
              onNew();
              onClose();
            }}
            className="border-border flex w-full items-center gap-2 border-t px-3 py-2 text-left text-sm font-medium text-amber-600 transition-colors hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/20"
          >
            <Plus size={14} />
            {newLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
