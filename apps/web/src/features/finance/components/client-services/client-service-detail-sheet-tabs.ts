import type { DetailSheetTabItem } from '@/components/shared';

export const CLIENT_SERVICE_DETAIL_SHEET_TABS = [
  { value: 'general', label: 'General' },
] as const satisfies readonly DetailSheetTabItem[];

export type ClientServiceDetailSheetTab =
  (typeof CLIENT_SERVICE_DETAIL_SHEET_TABS)[number]['value'];
