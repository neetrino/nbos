import type { BonusStatusEnum } from '@nbos/database';

/** NBOS Employee Wallet bonus pipeline grouping (see `08-Employee-Wallet.md`). */
export type WalletBonusPipelineGroup =
  | 'POTENTIAL'
  | 'IN_PROGRESS'
  | 'NEXT_PAYROLL'
  | 'PAID'
  | 'CORRECTIONS';

const BONUS_STATUS_TO_GROUP: Record<BonusStatusEnum, WalletBonusPipelineGroup> = {
  INCOMING: 'POTENTIAL',
  EARNED: 'IN_PROGRESS',
  PENDING_ELIGIBILITY: 'IN_PROGRESS',
  VESTED: 'IN_PROGRESS',
  ACTIVE: 'NEXT_PAYROLL',
  PAID: 'PAID',
  CLAWBACK: 'CORRECTIONS',
};

export function mapBonusStatusToWalletGroup(status: BonusStatusEnum): WalletBonusPipelineGroup {
  return BONUS_STATUS_TO_GROUP[status];
}

export const WALLET_BONUS_PIPELINE_LABEL: Record<WalletBonusPipelineGroup, string> = {
  POTENTIAL: 'Potential',
  IN_PROGRESS: 'In progress',
  NEXT_PAYROLL: 'Next payroll',
  PAID: 'Paid',
  CORRECTIONS: 'Corrections',
};
