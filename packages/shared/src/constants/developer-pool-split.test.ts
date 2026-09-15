import { describe, expect, it } from 'vitest';
import {
  DEVELOPER_POOL_BACKEND_PERCENT,
  DEVELOPER_POOL_FRONTEND_PERCENT,
  hasDistinctFrontendAssignee,
  splitDeveloperPoolAmount,
} from './developer-pool-split';

const PERCENT_BASE = 100;
const BACKEND_ID = 'dev-be';
const FRONTEND_ID = 'dev-fe';

describe('hasDistinctFrontendAssignee', () => {
  it('is false when Frontend is unset or matches Backend', () => {
    expect(hasDistinctFrontendAssignee(BACKEND_ID, null)).toBe(false);
    expect(hasDistinctFrontendAssignee(BACKEND_ID, undefined)).toBe(false);
    expect(hasDistinctFrontendAssignee(BACKEND_ID, BACKEND_ID)).toBe(false);
    expect(hasDistinctFrontendAssignee(null, null)).toBe(false);
  });

  it('is true when Frontend is a different employee', () => {
    expect(hasDistinctFrontendAssignee(BACKEND_ID, FRONTEND_ID)).toBe(true);
    expect(hasDistinctFrontendAssignee(null, FRONTEND_ID)).toBe(true);
  });
});

describe('splitDeveloperPoolAmount', () => {
  it('uses named 70/30 percents that sum to 100', () => {
    expect(DEVELOPER_POOL_BACKEND_PERCENT).toBe(70);
    expect(DEVELOPER_POOL_FRONTEND_PERCENT).toBe(30);
    expect(DEVELOPER_POOL_BACKEND_PERCENT + DEVELOPER_POOL_FRONTEND_PERCENT).toBe(PERCENT_BASE);
  });

  it('splits 70/30 when Frontend is a different employee', () => {
    expect(splitDeveloperPoolAmount('100.00', BACKEND_ID, FRONTEND_ID)).toEqual({
      backendAmount: '70.00',
      frontendAmount: '30.00',
    });
    expect(splitDeveloperPoolAmount(10, BACKEND_ID, FRONTEND_ID)).toEqual({
      backendAmount: '7.00',
      frontendAmount: '3.00',
    });
  });

  it('gives Backend 100% when Frontend is not assigned', () => {
    expect(splitDeveloperPoolAmount('100.00', BACKEND_ID, null)).toEqual({
      backendAmount: '100.00',
      frontendAmount: '0.00',
    });
    expect(splitDeveloperPoolAmount(0, BACKEND_ID, null)).toEqual({
      backendAmount: '0.00',
      frontendAmount: '0.00',
    });
  });

  it('gives Backend 100% when the same person occupies both slots', () => {
    expect(splitDeveloperPoolAmount('100.00', BACKEND_ID, BACKEND_ID)).toEqual({
      backendAmount: '100.00',
      frontendAmount: '0.00',
    });
  });

  it('treats frontend-only ids as a distinct Frontend share (API forbids this case)', () => {
    expect(splitDeveloperPoolAmount('100.00', null, FRONTEND_ID)).toEqual({
      backendAmount: '70.00',
      frontendAmount: '30.00',
    });
  });

  it('keeps remainder cents so parts sum to the total', () => {
    const split = splitDeveloperPoolAmount('10.01', BACKEND_ID, FRONTEND_ID);
    expect(split).toEqual({
      backendAmount: '7.01',
      frontendAmount: '3.00',
    });
    expect(Number(split.backendAmount) + Number(split.frontendAmount)).toBeCloseTo(10.01);
  });
});
