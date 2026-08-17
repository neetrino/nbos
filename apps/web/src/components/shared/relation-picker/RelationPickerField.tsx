'use client';

import { useCallback, useRef, useState, type KeyboardEvent } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DETAIL_SHEET_OUTLINED_ADD_BTN_CLASS,
  DETAIL_SHEET_OUTLINED_ADD_PLUS_CLASS,
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
  resolveRelationPickerMaxResults,
  resolveRelationPickerSearchDebounceMs,
  useRelationPickerOpenEffects,
} from './relation-picker-field-helpers';
import {
  RELATION_CREATE_LABELS,
  RELATION_KIND_LABELS,
  RELATION_PICKER_EMPLOYEE_PLACEHOLDER,
  type RelationPickerFieldProps,
  type RelationPickerOption,
} from './relation-picker.types';

export function RelationPickerField(props: RelationPickerFieldProps) {
  const {
    label,
    placeholder,
    entityKind,
    kindLabel = RELATION_KIND_LABELS[entityKind],
    createLabel = RELATION_CREATE_LABELS[entityKind],
    disabled = false,
    readOnly = false,
    className,
    onSearch,
    maxResults: maxResultsProp,
    listMaxHeightClass = RELATION_PICKER_DROPDOWN_LIST_CLASS,
    onOpenSelected,
    onCreate,
  } = props;
  const maxResults = resolveRelationPickerMaxResults(entityKind, maxResultsProp);
  const searchDebounceMs = resolveRelationPickerSearchDebounceMs(entityKind);

  const selectionDisplay = props.selectionDisplay ?? 'chips';
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
  const employeeDirectoryReadyRef = useRef(false);
  const { knownAvatars, rememberAvatar } = useMergedPickerAvatars(selectionAvatars, results);

  const interactionLocked = disabled || readOnly;
  const selectedIds = new Set<string>(multiple ? props.value : props.value ? [props.value] : []);

  const doSearch = useCallback(
    (q: string) => {
      const run = async () => {
        const showSpinner = entityKind !== 'employee' || !employeeDirectoryReadyRef.current;
        if (showSpinner) setLoading(true);
        try {
          const items = await onSearch(q);
          if (entityKind === 'employee') employeeDirectoryReadyRef.current = true;
          setResults(items.slice(0, maxResults));
          setHighlightIdx(-1);
        } finally {
          setLoading(false);
        }
      };
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (searchDebounceMs <= 0) {
        void run();
        return;
      }
      debounceRef.current = setTimeout(() => {
        void run();
      }, searchDebounceMs);
    },
    [entityKind, maxResults, onSearch, searchDebounceMs],
  );

  useRelationPickerOpenEffects({
    open,
    disabled: interactionLocked,
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
    if (interactionLocked) return;
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
    if (interactionLocked || !onCreate) return;
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

  const searchPlaceholder =
    placeholder ??
    (entityKind === 'employee'
      ? RELATION_PICKER_EMPLOYEE_PLACEHOLDER
      : `Search ${kindLabel.toLowerCase()}s…`);
  const multiChipCount = multiple && isMultiProps(props) ? props.value.length : 0;
  const showSelectionChips = selectionDisplay === 'chips';
  const showOutlinedAdd = multiple && multiChipCount > 0 && !open && showSelectionChips;

  return (
    <div
      ref={containerRef}
      className={cn(DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS, disabled && 'opacity-60', className)}
    >
      {label.trim() ? (
        showOutlinedAdd && !interactionLocked ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={DETAIL_SHEET_OUTLINED_ADD_BTN_CLASS}
            aria-label={`Add ${kindLabel.toLowerCase()}`}
          >
            <Plus size={12} aria-hidden className={DETAIL_SHEET_OUTLINED_ADD_PLUS_CLASS} />
            {label}
          </button>
        ) : (
          <span className={DETAIL_SHEET_OUTLINED_LABEL_CLASS}>{label}</span>
        )
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
          readOnly={readOnly}
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
