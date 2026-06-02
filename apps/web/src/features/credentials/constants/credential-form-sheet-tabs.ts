import { History, LayoutGrid, ScrollText } from 'lucide-react';
import type { DetailSheetTabItem } from '@/components/shared';

export const CREDENTIAL_FORM_SHEET_TABS = [
  { value: 'general', label: 'General', icon: LayoutGrid },
  { value: 'activity', label: 'Activity', icon: ScrollText },
  { value: 'secret-history', label: 'Secret history', icon: History },
] as const satisfies readonly DetailSheetTabItem[];

export type CredentialFormSheetTab = (typeof CREDENTIAL_FORM_SHEET_TABS)[number]['value'];
