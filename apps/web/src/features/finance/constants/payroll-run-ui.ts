import type { PayrollJournalKind, PayrollRunStatus } from '@/lib/api/payroll-runs';

export const PAYROLL_JOURNAL_KIND_LABEL: Record<PayrollJournalKind, string> = {
  CREATED: 'Created',
  APPROVED: 'Approved',
  CLOSED: 'Closed',
};

/** Labels for `audit_logs.action` values written by the payroll API. */
export function payrollAuditActionLabel(action: string): string {
  if (action === 'CREATED') return 'Created';
  if (action === 'STATUS_CHANGED') return 'Status changed';
  return action;
}

/** English fallback labels. Prefer `PAYROLL_RUN_STATUS_MESSAGE_KEY` at render. */
export const PAYROLL_RUN_STATUS_LABEL: Record<PayrollRunStatus, string> = {
  DRAFT: 'Draft',
  REVIEW: 'Review',
  APPROVED: 'Approved',
  PAYING: 'Paying',
  CLOSED: 'Closed',
};

export const PAYROLL_RUN_STATUS_MESSAGE_KEY = {
  DRAFT: 'status.DRAFT',
  REVIEW: 'status.REVIEW',
  APPROVED: 'status.APPROVED',
  PAYING: 'status.PAYING',
  CLOSED: 'status.CLOSED',
} as const;

export type PayrollRunStatusMessageKey =
  (typeof PAYROLL_RUN_STATUS_MESSAGE_KEY)[PayrollRunStatus];

export type PayrollRunActionMessageKey =
  | 'actions.sendToReview'
  | 'actions.approve'
  | 'actions.returnToDraft'
  | 'actions.markPaying'
  | 'actions.closeRun';

/** Workflow actions (must stay aligned with API `canTransitionPayrollRun`). */
export function payrollRunActionOptions(
  status: PayrollRunStatus,
): readonly { labelKey: PayrollRunActionMessageKey; to: PayrollRunStatus }[] {
  switch (status) {
    case 'DRAFT':
      return [{ labelKey: 'actions.sendToReview', to: 'REVIEW' }];
    case 'REVIEW':
      return [
        { labelKey: 'actions.approve', to: 'APPROVED' },
        { labelKey: 'actions.returnToDraft', to: 'DRAFT' },
      ];
    case 'APPROVED':
      return [{ labelKey: 'actions.markPaying', to: 'PAYING' }];
    case 'PAYING':
      return [{ labelKey: 'actions.closeRun', to: 'CLOSED' }];
    default:
      return [];
  }
}
