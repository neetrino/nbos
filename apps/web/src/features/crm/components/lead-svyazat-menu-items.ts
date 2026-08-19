import { LEAD_SVYAZAT_LABELS } from './lead-svyazat-labels';

export type SvyazatMenuMode = 'merge' | 'pour' | 'create' | 'attach';

export interface SvyazatMenuItem {
  id: SvyazatMenuMode;
  label: string;
  requiresNoContact?: boolean;
}

export interface SvyazatMenuGroup {
  id: 'merge' | 'add';
  label: string;
  items: readonly SvyazatMenuItem[];
}

export const LEAD_SVYAZAT_MENU_GROUPS: readonly SvyazatMenuGroup[] = [
  {
    id: 'merge',
    label: LEAD_SVYAZAT_LABELS.merge,
    items: [
      { id: 'merge', label: LEAD_SVYAZAT_LABELS.mergeLead },
      { id: 'pour', label: LEAD_SVYAZAT_LABELS.mergeContact },
    ],
  },
  {
    id: 'add',
    label: LEAD_SVYAZAT_LABELS.add,
    items: [
      { id: 'create', label: LEAD_SVYAZAT_LABELS.newContact, requiresNoContact: true },
      { id: 'attach', label: LEAD_SVYAZAT_LABELS.contactToWork, requiresNoContact: true },
    ],
  },
];

export function svyazatMenuItemDisabled(item: SvyazatMenuItem, hasContact: boolean): boolean {
  return Boolean(item.requiresNoContact && hasContact);
}
