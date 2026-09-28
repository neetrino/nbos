import { describe, expect, it } from 'vitest';

import {
  buildPayrollMatrixCellReleasePayload,
  shouldSkipPayrollMatrixMultiSourceSave,
} from './build-payroll-matrix-cell-release-payload';

describe('buildPayrollMatrixCellReleasePayload', () => {
  it('sums multi-source drafts 50 and 30 to release 80.00 with sourceAmounts', () => {
    const payload = buildPayrollMatrixCellReleasePayload({
      sourceEntryCount: 2,
      singleAmount: '80',
      sourceDrafts: [
        { bonusEntryId: 'be-50', amount: '50' },
        { bonusEntryId: 'be-70', amount: '30' },
      ],
    });

    expect(payload).toEqual({
      releaseThisMonth: '80.00',
      sourceAmounts: [
        { bonusEntryId: 'be-50', amount: '50.00' },
        { bonusEntryId: 'be-70', amount: '30.00' },
      ],
    });
  });

  it('omits sourceAmounts for a single-source cell', () => {
    const payload = buildPayrollMatrixCellReleasePayload({
      sourceEntryCount: 1,
      singleAmount: '50',
      sourceDrafts: [{ bonusEntryId: 'be-50', amount: '50' }],
    });

    expect(payload).toEqual({ releaseThisMonth: '50.00' });
    expect(payload.sourceAmounts).toBeUndefined();
  });

  it('omits empty and zero multi-source drafts', () => {
    const payload = buildPayrollMatrixCellReleasePayload({
      sourceEntryCount: 2,
      singleAmount: '',
      sourceDrafts: [
        { bonusEntryId: 'be-50', amount: '50' },
        { bonusEntryId: 'be-70', amount: '' },
        { bonusEntryId: 'be-90', amount: '0' },
      ],
    });

    expect(payload).toEqual({
      releaseThisMonth: '50.00',
      sourceAmounts: [{ bonusEntryId: 'be-50', amount: '50.00' }],
    });
  });
});

const SAVED_SPLIT = new Map([
  ['be-50', 50],
  ['be-70', 30],
]);

describe('shouldSkipPayrollMatrixMultiSourceSave', () => {
  it('skips a click that leaves the saved 50+30 split untouched', () => {
    const skip = shouldSkipPayrollMatrixMultiSourceSave({
      dirty: false,
      nextAmount: 0,
      savedAmount: 80,
      drafts: [
        { bonusEntryId: 'be-50', amount: '' },
        { bonusEntryId: 'be-70', amount: '' },
      ],
      savedIncludedByEntryId: SAVED_SPLIT,
      needsReason: false,
      reason: '',
    });

    expect(skip).toBe(true);
  });

  it('saves an explicit clear of the saved split', () => {
    const skip = shouldSkipPayrollMatrixMultiSourceSave({
      dirty: true,
      nextAmount: 0,
      savedAmount: 80,
      drafts: [
        { bonusEntryId: 'be-50', amount: '' },
        { bonusEntryId: 'be-70', amount: '' },
      ],
      savedIncludedByEntryId: SAVED_SPLIT,
      needsReason: false,
      reason: '',
    });

    expect(skip).toBe(false);
  });

  it('skips a dirty cell whose drafts still match the saved split', () => {
    const skip = shouldSkipPayrollMatrixMultiSourceSave({
      dirty: true,
      nextAmount: 80,
      savedAmount: 80,
      drafts: [
        { bonusEntryId: 'be-50', amount: '50' },
        { bonusEntryId: 'be-70', amount: '30' },
      ],
      savedIncludedByEntryId: SAVED_SPLIT,
      needsReason: false,
      reason: '',
    });

    expect(skip).toBe(true);
  });
});
