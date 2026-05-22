import type { WalletBonusPipelineGroup } from '@/lib/api/me';

/** One-line help under each bonus pipeline column on the wallet. */
export const WALLET_PIPELINE_GROUP_EXPLANATION: Record<WalletBonusPipelineGroup, string> = {
  POTENTIAL:
    'Not earned yet — usually waits on client payment, project delivery, or eligibility rules.',
  IN_PROGRESS:
    'Accrued or waiting on conditions (product done, KPI gate, pool funding). Not in payroll yet.',
  NEXT_PAYROLL:
    'Release approved or on an open payroll run — payout follows Finance payroll and Pay Now.',
  PAID: 'Marked paid on a payroll release. Remaining on the entry may still show timing differences.',
  CORRECTIONS:
    'Clawback or correction entry — reduced or reversed bonus; Finance can explain details.',
};

export const WALLET_PROJECT_PAYOUT_EXPLANATION: Record<'UNPAID' | 'PARTIAL' | 'PAID', string> = {
  UNPAID: 'No paid releases on your entries for this order yet.',
  PARTIAL:
    'Some of your bonus on this order was paid; the rest is still open or waiting on funding.',
  PAID: 'Your paid releases on this order match the planned payout for this scope.',
};

/** Read-only glossary (MVP; burned/carry-over copy until policy engine persists amounts). */
export const WALLET_COMPENSATION_GLOSSARY: ReadonlyArray<{ term: string; text: string }> = [
  {
    term: 'Partial pay',
    text: 'Salary or bonus was paid in one or more steps. Remaining is still on the payroll line or bonus entry.',
  },
  {
    term: 'Delayed',
    text: 'Bonus stays in Potential or In progress until the product pool is funded or KPI/eligibility passes.',
  },
  {
    term: 'Paid',
    text: 'Release amount was included in payroll and recorded as paid on the expense card.',
  },
  {
    term: 'Clawback',
    text: 'Bonus reversed or adjusted downward — shown under Corrections in the pipeline.',
  },
  {
    term: 'Burned (KPI)',
    text: 'Sales KPI may reduce payout at attach (burned). Monthly bonus cap (200% of base salary, default) defers excess; prior-month carry-over applies automatically when you attach bonuses in a later month.',
  },
  {
    term: 'Carry-over',
    text: 'Unpaid release balance moved to a later payroll month. Tracking in wallet will follow policy engine rollout.',
  },
];
