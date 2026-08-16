'use client';

import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  RELATION_PICKER_CHIP_STACK_CLASS,
  RELATION_PICKER_EMPTY_TRIGGER_CLASS,
} from '../detail-sheet-classes';
import { RelationPickerChip } from './RelationPickerChip';
import { relationPickerChipLabel } from './relation-picker-display-label';
import type {
  RelationEntityKind,
  RelationPickerFieldProps,
  RelationPickerMultiProps,
} from './relation-picker.types';

export function isMultiProps(props: RelationPickerFieldProps): props is RelationPickerMultiProps {
  return props.multiple === true;
}

export function ClosedRelationPicker({
  props,
  multiple,
  disabled,
  readOnly = false,
  placeholder,
  onOpen,
  onOpenSelected,
  entityKind,
  selectionDisplay,
  chipAvatars,
  onRemoveChip,
}: {
  props: RelationPickerFieldProps;
  multiple: boolean;
  disabled: boolean;
  readOnly?: boolean;
  placeholder: string;
  onOpen: () => void;
  onOpenSelected?: (id: string) => void;
  entityKind: RelationEntityKind;
  selectionDisplay: 'chips' | 'none';
  chipAvatars?: Record<string, string | null>;
  onRemoveChip?: (id: string) => void;
}) {
  const interactionLocked = disabled || readOnly;

  if (selectionDisplay === 'none') {
    return (
      <button
        type="button"
        disabled={interactionLocked}
        onClick={onOpen}
        className={cn(RELATION_PICKER_EMPTY_TRIGGER_CLASS, multiple && 'border-dashed')}
      >
        <Search size={14} className="shrink-0 opacity-70" />
        <span>{placeholder}</span>
      </button>
    );
  }

  if (multiple && isMultiProps(props)) {
    return (
      <ClosedMultiChips
        props={props}
        disabled={disabled}
        interactionLocked={interactionLocked}
        placeholder={placeholder}
        onOpen={onOpen}
        onOpenSelected={onOpenSelected}
        entityKind={entityKind}
        chipAvatars={chipAvatars}
        onRemoveChip={onRemoveChip}
      />
    );
  }

  if (!isMultiProps(props)) {
    return (
      <ClosedSingleChip
        props={props}
        disabled={disabled}
        interactionLocked={interactionLocked}
        placeholder={placeholder}
        onOpen={onOpen}
        onOpenSelected={onOpenSelected}
        entityKind={entityKind}
      />
    );
  }

  return null;
}

function ClosedMultiChips({
  props,
  disabled,
  interactionLocked,
  placeholder,
  onOpen,
  onOpenSelected,
  entityKind,
  chipAvatars,
  onRemoveChip,
}: {
  props: RelationPickerMultiProps;
  disabled: boolean;
  interactionLocked: boolean;
  placeholder: string;
  onOpen: () => void;
  onOpenSelected?: (id: string) => void;
  entityKind: RelationEntityKind;
  chipAvatars?: Record<string, string | null>;
  onRemoveChip?: (id: string) => void;
}) {
  const chips = props.value.map((id) => ({
    id,
    label: relationPickerChipLabel(props.selectionLabels[id], id),
  }));

  return (
    <div className={RELATION_PICKER_CHIP_STACK_CLASS}>
      {chips.map((chip) => (
        <RelationPickerChip
          key={chip.id}
          label={chip.label}
          entityKind={entityKind}
          disabled={disabled}
          imageUrl={chipAvatars?.[chip.id]}
          onOpen={onOpenSelected ? () => onOpenSelected(chip.id) : undefined}
          onClear={() => onRemoveChip?.(chip.id)}
        />
      ))}
      {chips.length === 0 ? (
        <button
          type="button"
          disabled={interactionLocked}
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

function ClosedSingleChip({
  props,
  disabled,
  interactionLocked,
  placeholder,
  onOpen,
  onOpenSelected,
  entityKind,
}: {
  props: Exclude<RelationPickerFieldProps, RelationPickerMultiProps>;
  disabled: boolean;
  interactionLocked: boolean;
  placeholder: string;
  onOpen: () => void;
  onOpenSelected?: (id: string) => void;
  entityKind: RelationEntityKind;
}) {
  const hasValue = Boolean(props.value);
  const chipLabel = relationPickerChipLabel(props.selectionLabel, props.value);

  if (hasValue) {
    return (
      <div className="w-full min-w-0">
        <RelationPickerChip
          label={chipLabel}
          subtitle={props.selectionSubtitle}
          entityKind={entityKind}
          disabled={disabled}
          imageUrl={props.selectionAvatar}
          onOpen={
            onOpenSelected && props.value ? () => onOpenSelected(props.value as string) : undefined
          }
          onReplace={interactionLocked ? undefined : onOpen}
          onClear={props.onClear}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={interactionLocked}
      onClick={onOpen}
      className={RELATION_PICKER_EMPTY_TRIGGER_CLASS}
    >
      <Search size={14} className="shrink-0 opacity-70" />
      <span>{placeholder}</span>
    </button>
  );
}
