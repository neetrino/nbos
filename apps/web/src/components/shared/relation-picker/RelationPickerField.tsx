'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  RELATION_PICKER_CHIP_STACK_CLASS,
  RELATION_PICKER_EMPTY_TRIGGER_CLASS,
  RELATION_PICKER_ENTITY_ICON_INLINE_CLASS,
  RELATION_PICKER_PERSON_AVATAR_CLASS,
} from '../detail-sheet-classes';
import { RelationPickerChip } from './RelationPickerChip';
import { RelationPickerEntityIcon } from './relation-picker-entity-icon';
import { RelationPickerDropdown } from './RelationPickerDropdown';
import {
  RELATION_CREATE_LABELS,
  RELATION_KIND_LABELS,
  type RelationEntityKind,
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
  return <div className={RELATION_PICKER_PERSON_AVATAR_CLASS}>{initialsFromLabel(label)}</div>;
}

function chipIcon(kind: RelationEntityKind, label: string): ReactNode {
  if (kind === 'contact' || kind === 'employee') {
    return personAvatar(label);
  }
  return (
    <RelationPickerEntityIcon
      kind={kind}
      variant="inline"
      className={RELATION_PICKER_ENTITY_ICON_INLINE_CLASS}
    />
  );
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
  const multiChipCount = multiple && isMultiProps(props) ? props.value.length : 0;
  const showFieldHeader =
    Boolean(label.trim()) || Boolean(icon) || (multiple && multiChipCount > 0 && !open);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full min-w-0',
        disabled && 'pointer-events-none opacity-60',
        className,
      )}
    >
      {showFieldHeader ? (
        <div className="text-foreground/85 mb-1.5 flex items-center justify-between gap-2 text-sm font-medium">
          {label.trim() || icon ? (
            <div className="flex min-w-0 items-center gap-1.5">
              {icon ? <span className="text-muted-foreground/70 shrink-0">{icon}</span> : null}
              {label.trim() ? <span className="truncate">{label}</span> : null}
            </div>
          ) : (
            <span aria-hidden />
          )}
          {multiple && multiChipCount > 0 && !open ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => setOpen(true)}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/40 flex size-7 shrink-0 items-center justify-center rounded-md transition-colors"
              aria-label={`Add ${kindLabel.toLowerCase()}`}
            >
              <Plus size={16} />
            </button>
          ) : null}
        </div>
      ) : null}

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
          entityKind={entityKind}
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
          entityKind={entityKind}
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
  entityKind,
}: {
  props: RelationPickerFieldProps;
  multiple: boolean;
  disabled: boolean;
  placeholder: string;
  onOpen: () => void;
  onOpenSelected?: (id: string) => void;
  entityKind: RelationEntityKind;
}) {
  if (multiple && isMultiProps(props)) {
    const chips = props.value.map((id) => ({
      id,
      label: props.selectionLabels[id] ?? id,
    }));

    return (
      <div className={RELATION_PICKER_CHIP_STACK_CLASS}>
        {chips.map((chip) => (
          <RelationPickerChip
            key={chip.id}
            label={chip.label}
            icon={chipIcon(entityKind, chip.label)}
            entityKind={entityKind}
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
        {chips.length === 0 ? (
          <button
            type="button"
            disabled={disabled}
            onClick={onOpen}
            className={cn(RELATION_PICKER_EMPTY_TRIGGER_CLASS, 'border-dashed')}
          >
            <Search size={14} className="shrink-0 opacity-70" />
            <span>{placeholder}</span>
          </button>
        ) : null}
      </div>
    );
  }

  if (!isMultiProps(props)) {
    const hasValue = Boolean(props.value);
    const chipLabel = props.selectionLabel ?? (hasValue ? String(props.value) : null);

    if (hasValue && chipLabel) {
      return (
        <div className="w-full min-w-0">
          <RelationPickerChip
            label={chipLabel}
            subtitle={props.selectionSubtitle}
            icon={chipIcon(entityKind, chipLabel)}
            entityKind={entityKind}
            disabled={disabled}
            onOpen={
              onOpenSelected && props.value
                ? () => onOpenSelected(props.value as string)
                : undefined
            }
            onReplace={disabled ? undefined : onOpen}
            onClear={props.onClear}
          />
        </div>
      );
    }

    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onOpen}
        className={RELATION_PICKER_EMPTY_TRIGGER_CLASS}
      >
        <Search size={14} className="shrink-0 opacity-70" />
        <span>{placeholder}</span>
      </button>
    );
  }

  return null;
}
