import type { WalletBonusPipelineGroup } from '@/lib/api/me';

export const WALLET_BONUS_PIPELINE_LABEL: Record<WalletBonusPipelineGroup, string> = {
  POTENTIAL: 'Potential',
  IN_PROGRESS: 'In progress',
  NEXT_PAYROLL: 'Next payroll',
  PAID: 'Paid',
  CORRECTIONS: 'Corrections',
};

export const WALLET_BONUS_PIPELINE_ORDER: readonly WalletBonusPipelineGroup[] = [
  'POTENTIAL',
  'IN_PROGRESS',
  'NEXT_PAYROLL',
  'PAID',
  'CORRECTIONS',
] as const;
