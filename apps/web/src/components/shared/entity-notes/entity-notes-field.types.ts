import type { EntityNoteEntityType } from './entity-notes-contract';

/**
 * Shared rich-text notes field for any entity detail sheet.
 *
 * @example
 * ```tsx
 * <EntityNotesField
 *   entityType="lead"
 *   entityId={lead.id}
 *   value={draft.notes}
 *   onChange={(notes) => patchDraft({ notes })}
 *   placeholder="Add notes about this lead…"
 * />
 * ```
 */
export interface EntityNotesFieldProps {
  entityType: EntityNoteEntityType;
  entityId: string;
  value: string | null;
  onChange: (value: string | null) => void;
  onBlur?: () => void;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
  label?: string;
  className?: string;
  /** e.g. stage-gate ring from CRM sheets */
  shellClassName?: string;
}
