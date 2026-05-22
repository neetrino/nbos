import type { ReactNode } from 'react';

export type RelationEntityKind =
  | 'contact'
  | 'company'
  | 'project'
  | 'partner'
  | 'product'
  | 'employee';

export type RelationPickerOption = {
  value: string;
  label: string;
  subtitle?: string;
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
  className?: string;
  onSearch: RelationPickerSearchFn;
  maxResults?: number;
  /** Opens the linked entity sheet (chip body click). */
  onOpenSelected?: (id: string) => void;
  /** Opens create flow; `searchQuery` is set when user typed in the search box. */
  onCreate?: (searchQuery: string) => void;
};

export type RelationPickerSingleProps = RelationPickerBaseProps & {
  multiple?: false;
  value: string | null | undefined;
  selectionLabel?: string | null;
  selectionSubtitle?: string | null;
  onSelect: (id: string, label: string) => void;
  onClear?: () => void;
};

export type RelationPickerMultiProps = RelationPickerBaseProps & {
  multiple: true;
  value: string[];
  selectionLabels: Record<string, string>;
  onChange: (ids: string[], labels: Record<string, string>) => void;
};

export type RelationPickerFieldProps = RelationPickerSingleProps | RelationPickerMultiProps;

export const RELATION_KIND_LABELS: Record<RelationEntityKind, string> = {
  contact: 'Contact',
  company: 'Company',
  project: 'Project',
  partner: 'Partner',
  product: 'Product',
  employee: 'Employee',
};

export const RELATION_CREATE_LABELS: Record<RelationEntityKind, string> = {
  contact: 'Create contact',
  company: 'Create company',
  project: 'Create project',
  partner: 'Create partner',
  product: 'Create product',
  employee: 'Add employee',
};
