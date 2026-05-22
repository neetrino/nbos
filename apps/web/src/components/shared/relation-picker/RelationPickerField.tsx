'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DETAIL_SHEET_PERSON_AVATAR_CLASS } from '../detail-sheet-classes';
import { RelationPickerChip } from './RelationPickerChip';
import { RelationPickerDropdown } from './RelationPickerDropdown';
import {
  RELATION_CREATE_LABELS,
  RELATION_KIND_LABELS,
  type RelationPickerFieldProps,
  type RelationPickerOption,
} from './relation-picker.types';

const DEFAULT_MAX_RESULTS = 8;
const SEARCH_DEBOUNCE_MS = 150;

function isMultiProps(props: RelationPickerFieldProps): props is RelationPickerFieldProps & {
  multiple: true;
} {
  return props.multiple === true;
}

function initialsFromLabel(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const a = parts[0]?.[0] ?? '';
  const b = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : (parts[0]?.[1] ?? '');
  return `${a}${b}`.toUpperCase() || '?';
}

function personAvatar(label: string): ReactNode {
  return <div className={DETAIL_SHEET_PERSON_AVATAR_CLASS}>{initialsFromLabel(label)}</div>;
}

export function RelationPickerField(props: RelationPickerFieldProps) {
  const {
    label,
    placeholder,
    icon,
    entityKind,
    kindLabel = RELATION_KIND_LABELS[entityKind],
    createLabel = RELATION_CREATE_LABELS[entityKind],
    disabled = false,
    className,
    onSearch,
    maxResults = DEFAULT_MAX_RESULTS,
    onOpenSelected,
    onCreate,
  } = props;

  const multiple = isMultiProps(props);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RelationPickerOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const selectedIds = new Set<string>(multiple ? props.value : props.value ? [props.value] : []);

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
      }, SEARCH_DEBOUNCE_MS);
    },
    [onSearch, maxResults],
  );

  useEffect(() => {
    if (open && !disabled) {
      doSearch('');
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
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
    const handler = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSelect = (id: string, itemLabel: string) => {
    if (disabled) return;
    if (multiple) {
      const nextIds = selectedIds.has(id)
        ? props.value.filter((value) => value !== id)
        : [...props.value, id];
      const nextLabels = { ...props.selectionLabels };
      if (selectedIds.has(id)) {
        delete nextLabels[id];
      } else {
        nextLabels[id] = itemLabel;
      }
      props.onChange(nextIds, nextLabels);
      return;
    }
    props.onSelect(id, itemLabel);
    setOpen(false);
    setQuery('');
  };

  const handleCreate = () => {
    if (disabled || !onCreate) return;
    onCreate(query.trim());
    setOpen(false);
    setQuery('');
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightIdx((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightIdx((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter' && highlightIdx >= 0 && results[highlightIdx]) {
      event.preventDefault();
      handleSelect(results[highlightIdx].value, results[highlightIdx].label);
    } else if (event.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
  };

  const searchPlaceholder = placeholder ?? `Search ${kindLabel.toLowerCase()}s…`;

  return (
    <div
      ref={containerRef}
      className={cn('relative', disabled && 'pointer-events-none opacity-60', className)}
    >
      <div className="text-foreground/85 mb-1.5 flex items-center gap-1.5 text-sm font-medium">
        {icon ? <span className="text-muted-foreground/70">{icon}</span> : null}
        {label}
      </div>

      {open ? (
        <RelationPickerDropdown
          query={query}
          onQueryChange={(value) => {
            setQuery(value);
            doSearch(value);
          }}
          onQueryClear={() => {
            setQuery('');
            doSearch('');
            inputRef.current?.focus();
          }}
          placeholder={searchPlaceholder}
          loading={loading}
          results={results}
          highlightIdx={highlightIdx}
          selectedIds={selectedIds}
          multiple={multiple}
          kindLabel={kindLabel}
          createLabel={createLabel}
          createEnabled={Boolean(onCreate)}
          onCreateClick={handleCreate}
          onSelect={handleSelect}
          onKeyDown={handleKeyDown}
          inputRef={inputRef}
        />
      ) : (
        <ClosedRelationPicker
          props={props}
          multiple={multiple}
          disabled={disabled}
          placeholder={searchPlaceholder}
          onOpen={() => setOpen(true)}
          onOpenSelected={onOpenSelected}
          personAvatar={entityKind === 'contact' || entityKind === 'employee'}
        />
      )}
    </div>
  );
}

function ClosedRelationPicker({
  props,
  multiple,
  disabled,
  placeholder,
  onOpen,
  onOpenSelected,
  personAvatar: usePersonAvatar,
}: {
  props: RelationPickerFieldProps;
  multiple: boolean;
  disabled: boolean;
  placeholder: string;
  onOpen: () => void;
  onOpenSelected?: (id: string) => void;
  personAvatar: boolean;
}) {
  if (multiple && isMultiProps(props)) {
    const chips = props.value.map((id) => ({
      id,
      label: props.selectionLabels[id] ?? id,
    }));

    return (
      <div className="flex flex-wrap items-center gap-2">
        {chips.map((chip) => (
          <RelationPickerChip
            key={chip.id}
            label={chip.label}
            icon={usePersonAvatar ? personAvatar(chip.label) : undefined}
            disabled={disabled}
            onOpen={onOpenSelected ? () => onOpenSelected(chip.id) : undefined}
            onClear={() => {
              const nextIds = props.value.filter((value) => value !== chip.id);
              const nextLabels = { ...props.selectionLabels };
              delete nextLabels[chip.id];
              props.onChange(nextIds, nextLabels);
            }}
          />
        ))}
        <button
          type="button"
          disabled={disabled}
          onClick={onOpen}
          className="border-border/60 text-muted-foreground hover:border-border hover:text-foreground inline-flex items-center gap-1.5 rounded-xl border border-dashed px-3 py-2 text-sm transition-colors"
        >
          <Search size={14} />
          {chips.length === 0 ? placeholder : 'Add…'}
        </button>
      </div>
    );
  }

  if (!isMultiProps(props)) {
    const hasValue = Boolean(props.value);
    const chipLabel = props.selectionLabel ?? (hasValue ? String(props.value) : null);

    if (hasValue && chipLabel) {
      return (
        <RelationPickerChip
          label={chipLabel}
          subtitle={props.selectionSubtitle}
          icon={usePersonAvatar ? personAvatar(chipLabel) : undefined}
          disabled={disabled}
          onOpen={
            onOpenSelected && props.value ? () => onOpenSelected(props.value as string) : undefined
          }
          onClear={props.onClear}
        />
      );
    }

    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onOpen}
        className="border-border/60 bg-muted/20 text-muted-foreground hover:border-border hover:bg-muted/30 flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors"
      >
        <Search size={14} className="shrink-0 opacity-70" />
        <span>{placeholder}</span>
      </button>
    );
  }

  return null;
}
