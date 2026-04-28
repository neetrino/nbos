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

export const PAYROLL_RUN_STATUS_LABEL: Record<PayrollRunStatus, string> = {
  DRAFT: 'Draft',
  REVIEW: 'Review',
  APPROVED: 'Approved',
  PAYING: 'Paying',
  CLOSED: 'Closed',
};

/** Workflow actions (must stay aligned with API `canTransitionPayrollRun`). */
export function payrollRunActionOptions(
  status: PayrollRunStatus,
): readonly { label: string; to: PayrollRunStatus }[] {
  switch (status) {
    case 'DRAFT':
      return [{ label: 'Send to review', to: 'REVIEW' }];
    case 'REVIEW':
      return [
        { label: 'Approve', to: 'APPROVED' },
        { label: 'Return to draft', to: 'DRAFT' },
      ];
    case 'APPROVED':
      return [{ label: 'Mark paying', to: 'PAYING' }];
    case 'PAYING':
      return [{ label: 'Close run', to: 'CLOSED' }];
    default:
      return [];
  }
}
