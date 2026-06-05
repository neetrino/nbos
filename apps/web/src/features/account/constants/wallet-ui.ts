import type { WalletBonusPipelineGroup } from '@/lib/api/me';

export type WalletSheetTab = 'overview' | 'bonuses' | 'payroll' | 'activity';

export const WALLET_SHEET_TABS: ReadonlyArray<{ id: WalletSheetTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'bonuses', label: 'Bonuses' },
  { id: 'payroll', label: 'Payroll' },
  { id: 'activity', label: 'Activity' },
] as const;

/** Pipeline bar segment colors (Tailwind utilities only). */
export const WALLET_PIPELINE_SEGMENT_CLASS: Record<WalletBonusPipelineGroup, string> = {
  POTENTIAL: 'bg-muted-foreground/35',
  IN_PROGRESS: 'bg-primary/45',
  NEXT_PAYROLL: 'bg-primary',
  PAID: 'bg-emerald-500',
  CORRECTIONS: 'bg-destructive/60',
};
