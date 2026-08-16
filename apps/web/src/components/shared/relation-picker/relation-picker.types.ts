import type { ReactNode } from 'react';

export type RelationEntityKind =
  | 'contact'
  | 'company'
  | 'project'
  | 'partner'
  | 'product'
  | 'employee'
  | 'order';

export type RelationPickerOption = {
  value: string;
  label: string;
  subtitle?: string;
  /** Employee / contact profile photo URL when available. */
  avatar?: string;
};

export type RelationPickerSearchFn = (query: string) => Promise<RelationPickerOption[]>;

export type RelationCreatePrefill = {
  name?: string;
  firstName?: string;
  lastName?: string;
  projectId?: string;
};

export type RelationCreateContext = {
  projectId?: string;
};

type RelationPickerBaseProps = {
  label: string;
  placeholder?: string;
  icon?: ReactNode;
  entityKind: RelationEntityKind;
  kindLabel?: string;
  createLabel?: string;
  disabled?: boolean;
  /** Display-only: full opacity, no search/replace/clear; `onOpenSelected` still works. */
  readOnly?: boolean;
  className?: string;
  onSearch: RelationPickerSearchFn;
  maxResults?: number;
  /** Max height of the results list (`max-h-*` + `overflow-y-auto`). */
  listMaxHeightClass?: string;
  /** Opens the linked entity sheet (avatar + label on the chip). */
  onOpenSelected?: (id: string) => void;
  /** Opens create flow; `searchQuery` is set when user typed in the search box. */
  onCreate?: (searchQuery: string) => void;
  /**
   * When `none`, selected chips/company row are not rendered (host shows custom cards).
   * Search still tracks current selection ids.
   */
  selectionDisplay?: 'chips' | 'none';
};

export type RelationPickerSingleProps = RelationPickerBaseProps & {
  multiple?: false;
  value: string | null | undefined;
  selectionLabel?: string | null;
  selectionSubtitle?: string | null;
  /** Profile photo for the selected employee/contact chip. */
  selectionAvatar?: string | null;
  onSelect: (id: string, label: string, avatar?: string) => void;
  /** When omitted, chip shows no X (use for required links — replace via search instead). */
  onClear?: () => void;
};

export type RelationPickerMultiProps = RelationPickerBaseProps & {
  multiple: true;
  value: string[];
  selectionLabels: Record<string, string>;
  /** Profile photos for selected chips (employee / contact). */
  selectionAvatars?: Record<string, string | null>;
  onChange: (
    ids: string[],
    labels: Record<string, string>,
    avatars?: Record<string, string | null>,
  ) => void;
};

export type RelationPickerFieldProps = RelationPickerSingleProps | RelationPickerMultiProps;

export const RELATION_KIND_LABELS: Record<RelationEntityKind, string> = {
  contact: 'Contact',
  company: 'Company',
  project: 'Project',
  partner: 'Partner',
  product: 'Product',
  employee: 'Employee',
  order: 'Order',
};

/** Empty-state trigger when an employee relation has no selection. */
export const RELATION_PICKER_EMPLOYEE_PLACEHOLDER = 'Choose…';

export const RELATION_CREATE_LABELS: Record<RelationEntityKind, string> = {
  contact: 'Create contact',
  company: 'Create company',
  project: 'Create project',
  partner: 'Create partner',
  product: 'Create product',
  employee: 'Add employee',
  order: 'Create order',
};
