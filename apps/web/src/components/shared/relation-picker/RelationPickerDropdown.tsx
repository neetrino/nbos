'use client';

import { Check, Loader2, Plus, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { RelationEntityKind, RelationPickerOption } from './relation-picker.types';
import { RelationPickerEntityIcon } from './relation-picker-entity-icon';

const DROPDOWN_PANEL_CLASS =
  'absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg dark:border-stone-700 dark:bg-stone-900';

const CREATE_BAR_CLASS =
  'flex w-full items-center gap-2 border-t border-sky-100 bg-sky-50/90 px-3 py-2.5 text-left text-sm font-medium text-sky-700 transition-colors hover:bg-sky-100/90 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:bg-sky-950/60';

type RelationPickerDropdownProps = {
  query: string;
  onQueryChange: (value: string) => void;
  onQueryClear: () => void;
  placeholder: string;
  loading: boolean;
  results: RelationPickerOption[];
  highlightIdx: number;
  selectedIds: Set<string>;
  multiple: boolean;
  entityKind: RelationEntityKind;
  kindLabel: string;
  createLabel: string;
  createEnabled: boolean;
  onCreateClick: () => void;
  onSelect: (value: string, label: string) => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
};

export function RelationPickerDropdown({
  query,
  onQueryChange,
  onQueryClear,
  placeholder,
  loading,
  results,
  highlightIdx,
  selectedIds,
  multiple,
  entityKind,
  kindLabel,
  createLabel,
  createEnabled,
  onCreateClick,
  onSelect,
  onKeyDown,
  inputRef,
}: RelationPickerDropdownProps) {
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
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="rounded-xl border-stone-200 pr-9 pl-9 text-sm dark:border-stone-700"
        />
        {query ? (
          <button
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={onQueryClear}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-1 flex size-7 -translate-y-1/2 items-center justify-center rounded-md"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

      <div className={DROPDOWN_PANEL_CLASS}>
        <div className="max-h-56 overflow-y-auto">
          {loading ? (
            <div className="text-muted-foreground flex items-center gap-2 px-3 py-2.5 text-xs">
              <Loader2 size={13} className="animate-spin" />
              Searching…
            </div>
          ) : null}

          {!loading && results.length === 0 && query ? (
            <div className="text-muted-foreground px-3 py-2.5 text-xs">No results found</div>
          ) : null}

          {!loading &&
            results.map((option, index) => {
              const selected = selectedIds.has(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onSelect(option.value, option.label)}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors',
                    selected
                      ? 'bg-sky-50 dark:bg-sky-950/30'
                      : 'hover:bg-stone-50 dark:hover:bg-stone-800',
                    index === highlightIdx && !selected && 'bg-stone-50 dark:bg-stone-800',
                  )}
                >
                  <RelationPickerEntityIcon kind={entityKind} />
                  <div className="min-w-0 flex-1">
                    <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
                      {kindLabel}
                    </p>
                    <p className="text-foreground truncate text-sm font-medium">{option.label}</p>
                    {option.subtitle ? (
                      <p className="text-muted-foreground truncate text-[11px]">
                        {option.subtitle}
                      </p>
                    ) : null}
                  </div>
                  {selected ? (
                    <Check size={16} className="shrink-0 text-sky-600 dark:text-sky-400" />
                  ) : null}
                </button>
              );
            })}
        </div>

        {createEnabled ? (
          <button type="button" onClick={onCreateClick} className={CREATE_BAR_CLASS}>
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sky-600 text-white">
              <Plus size={14} />
            </span>
            {createLabel}
            {query.trim() && !multiple ? (
              <span className="truncate font-normal text-sky-600/80 dark:text-sky-400/80">
                — “{query.trim()}”
              </span>
            ) : null}
          </button>
        ) : null}
      </div>
    </div>
  );
}
