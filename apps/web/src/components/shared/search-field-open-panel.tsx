'use client';

import type { KeyboardEvent, RefObject } from 'react';
import { Search, X, Plus, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  SearchFieldOptionButton,
  type SearchOption,
} from '@/components/shared/search-field-option';

export function SearchFieldOpenPanel(props: {
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
}) {
  const showSpinner = props.loading && props.results.length === 0;
  const showEmpty = !props.loading && props.results.length === 0 && Boolean(props.query);

  return (
    <div className="relative">
      <div className="relative">
        <Search
          size={14}
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
        />
        <Input
          ref={props.inputRef}
          value={props.query}
          disabled={props.disabled}
          onChange={(event) => props.onQueryChange(event.target.value)}
          onKeyDown={props.onKeyDown}
          placeholder={props.placeholder ?? 'Type to search...'}
          className="pr-9 pl-9 text-sm"
        />
        {props.query ? (
          <button
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={props.onClearQuery}
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
        {props.results.map((opt, index) => (
          <SearchFieldOptionButton
            key={opt.value}
            option={opt}
            highlighted={index === props.highlightIdx}
            saving={props.saving}
            onSelect={props.onSelect}
          />
        ))}
        {props.onNew ? (
          <button
            type="button"
            onClick={() => {
              props.onNew?.();
              props.onClose();
            }}
            className="border-border flex w-full items-center gap-2 border-t px-3 py-2 text-left text-sm font-medium text-amber-600 transition-colors hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/20"
          >
            <Plus size={14} />
            {props.newLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
