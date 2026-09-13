import { describe, expect, it } from 'vitest';
import { PAYROLL_RUN_STATUS_MESSAGE_KEY, payrollRunActionOptions } from './payroll-run-ui';

describe('payroll-run-ui i18n keys', () => {
  it('keeps status value codes and exposes message keys', () => {
    expect(PAYROLL_RUN_STATUS_MESSAGE_KEY.DRAFT).toBe('status.DRAFT');
    expect(PAYROLL_RUN_STATUS_MESSAGE_KEY.REVIEW).toBe('status.REVIEW');
    expect(Object.keys(PAYROLL_RUN_STATUS_MESSAGE_KEY)).toEqual([
      'DRAFT',
      'REVIEW',
      'APPROVED',
      'PAYING',
      'CLOSED',
    ]);
  });

  it('returns action message keys instead of English labels', () => {
    expect(payrollRunActionOptions('DRAFT')).toEqual([
      { labelKey: 'actions.sendToReview', to: 'REVIEW' },
    ]);
    expect(payrollRunActionOptions('REVIEW')).toEqual([
      { labelKey: 'actions.approve', to: 'APPROVED' },
      { labelKey: 'actions.returnToDraft', to: 'DRAFT' },
    ]);
    expect(payrollRunActionOptions('APPROVED')).toEqual([
      { labelKey: 'actions.markPaying', to: 'PAYING' },
    ]);
    expect(payrollRunActionOptions('PAYING')).toEqual([
      { labelKey: 'actions.closeRun', to: 'CLOSED' },
    ]);
    expect(payrollRunActionOptions('CLOSED')).toEqual([]);
  });
});
