import { Decimal } from '@nbos/database';

export const CUTOVER_UNPAID_KINDS = [
  'UNPAID_BONUS',
  'INCLUDED_UNPAID_RELEASE',
  'LEFTOVER_SALARY_CAP_CARRY',
  'UNAPPLIED_REFUND_RESIDUAL',
  'ALREADY_SETTLED',
] as const;

export type CutoverUnpaidKind = (typeof CUTOVER_UNPAID_KINDS)[number];

export type CutoverUnpaidInventoryRow = {
  kind: CutoverUnpaidKind;
  sourceId: string;
  employeeId: string;
  earnedPeriod: string | null;
  status: string;
  amount: Decimal;
  plannedAmount: Decimal | null;
  attributedPaidCash: Decimal | null;
  explanation: string;
};

export type CutoverUnpaidInventory = {
  unpaidBonuses: CutoverUnpaidInventoryRow[];
  includedUnpaidReleases: CutoverUnpaidInventoryRow[];
  leftoverSalaryCapCarry: CutoverUnpaidInventoryRow[];
  unappliedRefundResiduals: CutoverUnpaidInventoryRow[];
  alreadySettled: CutoverUnpaidInventoryRow[];
};

export type CutoverBonusEntrySnapshot = {
  id: string;
  employeeId: string;
  amount: Decimal;
  earnedPeriod: string | null;
  status: string;
};

export type CutoverBonusReleaseSnapshot = {
  id: string;
  bonusEntryId: string;
  employeeId: string;
  amount: Decimal;
  payrollIncludedAmount: Decimal | null;
  kpiBurnedAmount: Decimal | null;
  status: string;
  payrollRunId: string | null;
  payrollCarryOverAmount: Decimal | null;
  payrollCarryOverRemaining: Decimal | null;
  payrollRun: { id: string; status: string; payrollMonth: string } | null;
};

export type CutoverSalaryLineSnapshot = {
  id: string;
  employeeId: string;
  expenseId: string | null;
  paidAmount: Decimal;
  remainingAmount: Decimal;
  status: string;
  payrollRun: { id: string; status: string };
};

export type CutoverPaymentSnapshot = {
  id: string;
  expenseId: string;
  amount: Decimal;
  notes: string | null;
};

export type CutoverUnpaidSnapshots = {
  entries: CutoverBonusEntrySnapshot[];
  releases: CutoverBonusReleaseSnapshot[];
  salaryLines: CutoverSalaryLineSnapshot[];
  payments: CutoverPaymentSnapshot[];
};

type FindMany<T> = {
  findMany: (args?: unknown) => Promise<T[]>;
};

export type CutoverUnpaidInventoryDb = {
  bonusEntry: FindMany<CutoverBonusEntrySnapshot>;
  bonusRelease: FindMany<CutoverBonusReleaseSnapshot>;
  salaryLine: FindMany<CutoverSalaryLineSnapshot>;
  expensePayment: FindMany<CutoverPaymentSnapshot>;
};
