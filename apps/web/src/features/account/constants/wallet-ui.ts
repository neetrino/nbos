import type { WalletBonusPipelineGroup } from '@/lib/api/me';

export const WALLET_PIPELINE_LABEL_KEYS = {
  POTENTIAL: 'POTENTIAL',
  IN_PROGRESS: 'IN_PROGRESS',
  NEXT_PAYROLL: 'NEXT_PAYROLL',
  PAID: 'PAID',
  CORRECTIONS: 'CORRECTIONS',
} as const satisfies Record<WalletBonusPipelineGroup, string>;

export const WALLET_PIPELINE_EXPLAIN_KEYS = {
  POTENTIAL: 'explainPotential',
  IN_PROGRESS: 'explainInProgress',
  NEXT_PAYROLL: 'explainNextPayroll',
  PAID: 'explainPaid',
  CORRECTIONS: 'explainCorrections',
} as const satisfies Record<WalletBonusPipelineGroup, string>;

export const WALLET_PAYOUT_EXPLAIN_KEYS = {
  UNPAID: 'explainUnpaid',
  PARTIAL: 'explainPartial',
  PAID: 'explainPaid',
} as const;

export const WALLET_GLOSSARY_KEYS = [
  { term: 'partialPayTerm', text: 'partialPayText' },
  { term: 'delayedTerm', text: 'delayedText' },
  { term: 'paidTerm', text: 'paidText' },
  { term: 'clawbackTerm', text: 'clawbackText' },
  { term: 'burnedTerm', text: 'burnedText' },
  { term: 'carryOverTerm', text: 'carryOverText' },
] as const;

export type WalletSheetTab = 'overview' | 'bonuses' | 'payroll' | 'activity';

export const WALLET_SHEET_TAB_VALUES: readonly WalletSheetTab[] = [
  'overview',
  'bonuses',
  'payroll',
  'activity',
] as const;

/** Pipeline bar segment colors (Tailwind utilities only). */
export const WALLET_PIPELINE_SEGMENT_CLASS: Record<WalletBonusPipelineGroup, string> = {
  POTENTIAL: 'bg-muted-foreground/35',
  IN_PROGRESS: 'bg-primary/45',
  NEXT_PAYROLL: 'bg-primary',
  PAID: 'bg-emerald-500',
  CORRECTIONS: 'bg-destructive/60',
};
