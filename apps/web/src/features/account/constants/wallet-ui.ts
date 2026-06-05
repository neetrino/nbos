import type { WalletBonusPipelineGroup } from '@/lib/api/me';

export type WalletSheetTab = 'overview' | 'bonuses' | 'payroll' | 'activity';

export const WALLET_SHEET_TABS: ReadonlyArray<{ value: WalletSheetTab; label: string }> = [
  { value: 'overview', label: 'Overview' },
  { value: 'bonuses', label: 'Bonuses' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'activity', label: 'Activity' },
] as const;

/** Pipeline bar segment colors (Tailwind utilities only). */
export const WALLET_PIPELINE_SEGMENT_CLASS: Record<WalletBonusPipelineGroup, string> = {
  POTENTIAL: 'bg-muted-foreground/35',
  IN_PROGRESS: 'bg-primary/45',
  NEXT_PAYROLL: 'bg-primary',
  PAID: 'bg-emerald-500',
  CORRECTIONS: 'bg-destructive/60',
};
