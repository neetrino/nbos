'use client';

import { useRef, type CSSProperties, type KeyboardEvent, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Check, Loader2, Plus, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { PORTAL_DROPDOWN_Z_CLASS } from '@/lib/overlay-z-index';
import type { RelationEntityKind, RelationPickerOption } from './relation-picker.types';
import { relationPickerOptionLeading } from './relation-picker-entity-icon';
import {
  useRelationPickerDropdownBox,
  type RelationPickerDropdownBox,
} from './relation-picker-dropdown-position';

const DROPDOWN_PANEL_CLASS = [
  'fixed flex flex-col overflow-hidden rounded-xl border border-border bg-popover shadow-lg',
  PORTAL_DROPDOWN_Z_CLASS,
].join(' ');

const CREATE_BAR_CLASS =
  'flex w-full shrink-0 items-center gap-2 border-t border-sky-100 bg-sky-50/90 px-3 py-2.5 text-left text-sm font-medium text-sky-700 transition-colors hover:bg-sky-100/90 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:bg-sky-950/60';

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
  onSelect: (value: string, label: string, avatar?: string) => void;
  onKeyDown: (event: KeyboardEvent) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  panelRef: RefObject<HTMLDivElement | null>;
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
  panelRef,
}: RelationPickerDropdownProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const box = useRelationPickerDropdownBox(anchorRef, true);
  const panel =
    box && typeof document !== 'undefined'
      ? createPortal(
          <RelationPickerResultsPanel
            box={box}
            panelRef={panelRef}
            loading={loading}
            results={results}
            highlightIdx={highlightIdx}
            selectedIds={selectedIds}
            entityKind={entityKind}
            kindLabel={kindLabel}
            createLabel={createLabel}
            createEnabled={createEnabled}
            query={query}
            multiple={multiple}
            onCreateClick={onCreateClick}
            onSelect={onSelect}
          />,
          document.body,
        )
      : null;

  return (
    <div className="relative">
      <RelationPickerSearchInput
        anchorRef={anchorRef}
        inputRef={inputRef}
        query={query}
        placeholder={placeholder}
        onQueryChange={onQueryChange}
        onQueryClear={onQueryClear}
        onKeyDown={onKeyDown}
      />
      {panel}
    </div>
  );
}

function RelationPickerSearchInput({
  anchorRef,
  inputRef,
  query,
  placeholder,
  onQueryChange,
  onQueryClear,
  onKeyDown,
}: {
  anchorRef: RefObject<HTMLDivElement | null>;
  inputRef: RefObject<HTMLInputElement | null>;
  query: string;
  placeholder: string;
  onQueryChange: (value: string) => void;
  onQueryClear: () => void;
  onKeyDown: (event: KeyboardEvent) => void;
}) {
  return (
    <div ref={anchorRef} className="relative">
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
        className="border-border rounded-xl pr-9 pl-9 text-sm"
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
  );
}

function RelationPickerResultsPanel({
  box,
  panelRef,
  loading,
  results,
  highlightIdx,
  selectedIds,
  entityKind,
  kindLabel,
  createLabel,
  createEnabled,
  query,
  multiple,
  onCreateClick,
  onSelect,
}: {
  box: RelationPickerDropdownBox;
  panelRef: RefObject<HTMLDivElement | null>;
  loading: boolean;
  results: RelationPickerOption[];
  highlightIdx: number;
  selectedIds: Set<string>;
  entityKind: RelationEntityKind;
  kindLabel: string;
  createLabel: string;
  createEnabled: boolean;
  query: string;
  multiple: boolean;
  onCreateClick: () => void;
  onSelect: (value: string, label: string, avatar?: string) => void;
}) {
  const boxStyle: CSSProperties = {
    top: box.top,
    left: box.left,
    width: box.width,
    maxHeight: box.maxHeight,
  };

  return (
    <div ref={panelRef} className={DROPDOWN_PANEL_CLASS} style={boxStyle}>
      <div className="min-h-0 flex-1 overflow-y-auto">
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
          results.map((option, index) => (
            <RelationPickerResultButton
              key={option.value}
              option={option}
              entityKind={entityKind}
              kindLabel={kindLabel}
              selected={selectedIds.has(option.value)}
              highlighted={index === highlightIdx}
              onSelect={onSelect}
            />
          ))}
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
  );
}

function RelationPickerResultButton({
  option,
  entityKind,
  kindLabel,
  selected,
  highlighted,
  onSelect,
}: {
  option: RelationPickerOption;
  entityKind: RelationEntityKind;
  kindLabel: string;
  selected: boolean;
  highlighted: boolean;
  onSelect: (value: string, label: string, avatar?: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(option.value, option.label, option.avatar)}
      className={cn(
        'flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors',
        selected ? 'bg-sky-50 dark:bg-sky-950/30' : 'hover:bg-muted',
        highlighted && !selected && 'bg-muted',
      )}
    >
      {relationPickerOptionLeading(entityKind, option.label, 'boxed', option.avatar)}
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
          {kindLabel}
        </p>
        <p className="text-foreground truncate text-sm font-medium">{option.label}</p>
        {option.subtitle ? (
          <p className="text-muted-foreground truncate text-[11px]">{option.subtitle}</p>
        ) : null}
      </div>
      {selected ? <Check size={16} className="shrink-0 text-sky-600 dark:text-sky-400" /> : null}
    </button>
  );
}
