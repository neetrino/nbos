'use client';

import { useCallback, useRef, useState, type KeyboardEvent } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DETAIL_SHEET_OUTLINED_ADD_BTN_CLASS,
  DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS,
  DETAIL_SHEET_OUTLINED_LABEL_CLASS,
  RELATION_PICKER_DROPDOWN_LIST_CLASS,
} from '../detail-sheet-classes';
import { ClosedRelationPicker, isMultiProps } from './ClosedRelationPicker';
import { RelationPickerDropdown } from './RelationPickerDropdown';
import {
  mergeAvatarRecords,
  pickAvatarRecord,
  useMergedPickerAvatars,
} from './relation-picker-avatars';
import {
  RelationPickerHeader,
  useRelationPickerOpenEffects,
} from './relation-picker-field-helpers';
import {
  RELATION_CREATE_LABELS,
  RELATION_KIND_LABELS,
  type RelationPickerFieldProps,
  type RelationPickerOption,
} from './relation-picker.types';

const DEFAULT_MAX_RESULTS = 8;
const SEARCH_DEBOUNCE_MS = 150;

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
    listMaxHeightClass = RELATION_PICKER_DROPDOWN_LIST_CLASS,
    onOpenSelected,
    onCreate,
  } = props;

  const selectionDisplay = props.selectionDisplay ?? 'chips';
  const labelPlacement =
    props.labelPlacement ?? (entityKind === 'employee' ? 'outlined' : 'header');
  const isOutlined = labelPlacement === 'outlined';
  const multiple = isMultiProps(props);
  const selectionAvatars = multiple ? props.selectionAvatars : undefined;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RelationPickerOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const { knownAvatars, rememberAvatar } = useMergedPickerAvatars(selectionAvatars, results);

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

  useRelationPickerOpenEffects({
    open,
    disabled,
    doSearch,
    containerRef,
    inputRef,
    debounceRef,
    setOpen,
    setQuery,
  });

  const emitMultiChange = (
    nextIds: string[],
    nextLabels: Record<string, string>,
    extra?: Record<string, string | null>,
  ) => {
    if (!isMultiProps(props)) return;
    const merged = mergeAvatarRecords(knownAvatars, props.selectionAvatars, extra);
    props.onChange(nextIds, nextLabels, pickAvatarRecord(nextIds, merged));
  };

  const handleSelect = (id: string, itemLabel: string, avatar?: string) => {
    if (disabled) return;
    rememberAvatar(id, avatar);
    if (multiple && isMultiProps(props)) {
      applyMultiSelect(props, selectedIds, id, itemLabel, avatar, emitMultiChange);
      return;
    }
    if (!isMultiProps(props)) props.onSelect(id, itemLabel, avatar);
    setOpen(false);
    setQuery('');
  };

  const handleRemoveChip = (id: string) => {
    if (!isMultiProps(props)) return;
    const nextIds = props.value.filter((value) => value !== id);
    const nextLabels = { ...props.selectionLabels };
    delete nextLabels[id];
    emitMultiChange(nextIds, nextLabels);
  };

  const handleCreate = () => {
    if (disabled || !onCreate) return;
    onCreate(query.trim());
    setOpen(false);
    setQuery('');
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightIdx((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightIdx((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter' && highlightIdx >= 0 && results[highlightIdx]) {
      event.preventDefault();
      handleSelect(
        results[highlightIdx].value,
        results[highlightIdx].label,
        results[highlightIdx].avatar,
      );
    } else if (event.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
  };

  const searchPlaceholder = placeholder ?? `Search ${kindLabel.toLowerCase()}s…`;
  const multiChipCount = multiple && isMultiProps(props) ? props.value.length : 0;
  const showSelectionChips = selectionDisplay === 'chips';
  const showOutlinedAdd =
    isOutlined && multiple && multiChipCount > 0 && !open && showSelectionChips;
  const showFieldHeader =
    !isOutlined &&
    (Boolean(label.trim()) ||
      Boolean(icon) ||
      (multiple && multiChipCount > 0 && !open && showSelectionChips));

  return (
    <div
      ref={containerRef}
      className={cn(
        isOutlined ? DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS : 'relative w-full min-w-0',
        disabled && 'pointer-events-none opacity-60',
        className,
      )}
    >
      {isOutlined && label.trim() ? (
        <span className={DETAIL_SHEET_OUTLINED_LABEL_CLASS}>{label}</span>
      ) : null}
      {showOutlinedAdd ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(true)}
          className={DETAIL_SHEET_OUTLINED_ADD_BTN_CLASS}
          aria-label={`Add ${kindLabel.toLowerCase()}`}
        >
          <Plus size={14} />
        </button>
      ) : null}
      {showFieldHeader ? (
        <RelationPickerHeader
          label={label}
          icon={icon}
          showAdd={multiple && multiChipCount > 0 && !open && showSelectionChips}
          addAriaLabel={`Add ${kindLabel.toLowerCase()}`}
          disabled={disabled}
          onAdd={() => setOpen(true)}
        />
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
          listMaxHeightClass={listMaxHeightClass}
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
          selectionDisplay={selectionDisplay}
          chipAvatars={knownAvatars}
          onRemoveChip={handleRemoveChip}
        />
      )}
    </div>
  );
}

function applyMultiSelect(
  props: Extract<RelationPickerFieldProps, { multiple: true }>,
  selectedIds: Set<string>,
  id: string,
  itemLabel: string,
  avatar: string | undefined,
  emit: (
    ids: string[],
    labels: Record<string, string>,
    extra?: Record<string, string | null>,
  ) => void,
): void {
  const removing = selectedIds.has(id);
  const nextIds = removing ? props.value.filter((value) => value !== id) : [...props.value, id];
  const nextLabels = { ...props.selectionLabels };
  if (removing) delete nextLabels[id];
  else nextLabels[id] = itemLabel;
  const extra = !removing && avatar?.trim() ? { [id]: avatar } : undefined;
  emit(nextIds, nextLabels, extra);
}
