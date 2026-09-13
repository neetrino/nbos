import type enPayroll from '@/messages/en/payroll.json';
import type { MessageLeafKeys } from '@/i18n/message-leaf-keys';
import type { BonusReleaseType } from '@/lib/api/bonus';
import type { ExpenseLedgerPaymentStatus } from '@/lib/api/finance';
import type { EmployeeSalesKpiSource } from '@/lib/api/payroll-runs';
import {
  BONUS_BREAKDOWN_STATUS_MESSAGE_KEY,
  type BonusPolicyBreakdownStatus,
} from '@/features/finance/constants/bonus-breakdown-status-ui';
import { BONUS_RELEASE_TYPE_MESSAGE_KEY } from '@/features/finance/constants/bonus-release-type-ui';
import {
  EXPENSE_LEDGER_PAYMENT_STATUS_MESSAGE_KEY,
  type ExpenseLedgerPaymentStatusPresentation,
} from '@/features/finance/constants/expense-ledger-payment-status';
import {
  COMPENSATION_PAYOUT_PHASE_DESCRIPTION_KEY,
  COMPENSATION_PAYOUT_PHASE_LABEL_KEY,
} from '@/features/finance/constants/compensation-payout-phase-ui';
import { PAYROLL_RUN_STATUS_MESSAGE_KEY } from '@/features/finance/constants/payroll-run-ui';
import type { PayrollRunStatus } from '@/lib/api/payroll-runs';
import { SALARY_LINE_STATUS_MESSAGE_KEY } from '@/features/finance/components/payroll/payroll-i18n-keys';
import type { SalaryLineStatus } from '@/lib/api/payroll-runs';

export type PayrollMessageKey = MessageLeafKeys<typeof enPayroll>;

export type PayrollTranslator = (
  key: PayrollMessageKey,
  values?: Record<string, string | number | Date>,
) => string;

export function translateSalaryLineStatus(status: SalaryLineStatus, t: PayrollTranslator): string {
  const key = SALARY_LINE_STATUS_MESSAGE_KEY[status];
  return key ? t(key) : status;
}

export function translatePayrollRunStatus(status: PayrollRunStatus, t: PayrollTranslator): string {
  const key = PAYROLL_RUN_STATUS_MESSAGE_KEY[status];
  return key ? t(key) : status;
}

export function translateCompensationPayoutPhaseLabel(
  phase: keyof typeof COMPENSATION_PAYOUT_PHASE_LABEL_KEY,
  t: PayrollTranslator,
): string {
  return t(COMPENSATION_PAYOUT_PHASE_LABEL_KEY[phase]);
}

export function translateCompensationPayoutPhaseDescription(
  phase: keyof typeof COMPENSATION_PAYOUT_PHASE_DESCRIPTION_KEY,
  t: PayrollTranslator,
): string {
  return t(COMPENSATION_PAYOUT_PHASE_DESCRIPTION_KEY[phase]);
}

export function translateExpenseLedgerPaymentStatus(
  status: ExpenseLedgerPaymentStatus,
  t: PayrollTranslator,
): string {
  return t(EXPENSE_LEDGER_PAYMENT_STATUS_MESSAGE_KEY[status]);
}

export function translateExpenseLedgerPaymentStatusPresentation(
  status: ExpenseLedgerPaymentStatus,
  t: PayrollTranslator,
): ExpenseLedgerPaymentStatusPresentation {
  const presentation = {
    PAID: {
      messageKey: EXPENSE_LEDGER_PAYMENT_STATUS_MESSAGE_KEY.PAID,
      variant: 'emerald' as const,
    },
    PARTIAL: {
      messageKey: EXPENSE_LEDGER_PAYMENT_STATUS_MESSAGE_KEY.PARTIAL,
      variant: 'amber' as const,
    },
    UNPAID: {
      messageKey: EXPENSE_LEDGER_PAYMENT_STATUS_MESSAGE_KEY.UNPAID,
      variant: 'orange' as const,
    },
  }[status];
  return {
    messageKey: presentation.messageKey,
    label: t(presentation.messageKey),
    variant: presentation.variant,
  };
}

export function translateBonusBreakdownStatus(
  status: BonusPolicyBreakdownStatus,
  t: PayrollTranslator,
): string {
  return t(BONUS_BREAKDOWN_STATUS_MESSAGE_KEY[status]);
}

export function translateBonusReleaseType(type: BonusReleaseType, t: PayrollTranslator): string {
  return t(BONUS_RELEASE_TYPE_MESSAGE_KEY[type]);
}

export function translateSalesKpiSource(
  source: EmployeeSalesKpiSource,
  t: PayrollTranslator,
): string {
  return t(`compensation.kpi.source.${source}` as PayrollMessageKey);
}
