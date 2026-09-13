import type { PayrollJournalKind, PayrollRunStatus } from '@/lib/api/payroll-runs';

export const PAYROLL_JOURNAL_KIND_MESSAGE_KEY = {
  CREATED: 'audit.journalKind.CREATED',
  APPROVED: 'audit.journalKind.APPROVED',
  CLOSED: 'audit.journalKind.CLOSED',
} as const;

export type PayrollJournalKindMessageKey =
  (typeof PAYROLL_JOURNAL_KIND_MESSAGE_KEY)[PayrollJournalKind];

export const PAYROLL_AUDIT_ACTION_MESSAGE_KEY = {
  CREATED: 'audit.action.CREATED',
  STATUS_CHANGED: 'audit.action.STATUS_CHANGED',
} as const;

export type PayrollAuditActionMessageKey =
  (typeof PAYROLL_AUDIT_ACTION_MESSAGE_KEY)[keyof typeof PAYROLL_AUDIT_ACTION_MESSAGE_KEY];

/** Message keys for `audit_logs.action` values written by the payroll API. */
export function payrollAuditActionMessageKey(action: string): PayrollAuditActionMessageKey | null {
  if (action === 'CREATED' || action === 'STATUS_CHANGED') {
    return PAYROLL_AUDIT_ACTION_MESSAGE_KEY[action];
  }
  return null;
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

export type PayrollRunStatusMessageKey = (typeof PAYROLL_RUN_STATUS_MESSAGE_KEY)[PayrollRunStatus];

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
