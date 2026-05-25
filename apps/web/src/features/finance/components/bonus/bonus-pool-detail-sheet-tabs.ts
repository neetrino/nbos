import { Banknote, Gift, LayoutGrid } from 'lucide-react';
import type { DetailSheetTabItem } from '@/components/shared';

export const BONUS_POOL_DETAIL_SHEET_TABS = [
  { value: 'general', label: 'General', icon: LayoutGrid },
  { value: 'funding', label: 'Funding', icon: Banknote },
  { value: 'bonuses', label: 'Bonuses', icon: Gift },
] as const satisfies readonly DetailSheetTabItem[];

export type BonusPoolDetailSheetTab = (typeof BONUS_POOL_DETAIL_SHEET_TABS)[number]['value'];
