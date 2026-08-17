import { describe, expect, it } from 'vitest';
import {
  DEVELOPER_POOL_BACKEND_PERCENT,
  DEVELOPER_POOL_FRONTEND_PERCENT,
  splitDeveloperPoolAmount,
} from './developer-pool-split';

const PERCENT_BASE = 100;

describe('splitDeveloperPoolAmount', () => {
  it('uses named 70/30 percents that sum to 100', () => {
    expect(DEVELOPER_POOL_BACKEND_PERCENT).toBe(70);
    expect(DEVELOPER_POOL_FRONTEND_PERCENT).toBe(30);
    expect(DEVELOPER_POOL_BACKEND_PERCENT + DEVELOPER_POOL_FRONTEND_PERCENT).toBe(PERCENT_BASE);
  });

  it('splits 70/30 when Frontend is assigned', () => {
    expect(splitDeveloperPoolAmount('100.00', true)).toEqual({
      backendAmount: '70.00',
      frontendAmount: '30.00',
    });
    expect(splitDeveloperPoolAmount(10, true)).toEqual({
      backendAmount: '7.00',
      frontendAmount: '3.00',
    });
  });

  it('gives Backend 100% when Frontend is not assigned', () => {
    expect(splitDeveloperPoolAmount('100.00', false)).toEqual({
      backendAmount: '100.00',
      frontendAmount: '0.00',
    });
    expect(splitDeveloperPoolAmount(0, false)).toEqual({
      backendAmount: '0.00',
      frontendAmount: '0.00',
    });
  });

  it('keeps remainder cents so parts sum to the total', () => {
    const split = splitDeveloperPoolAmount('10.01', true);
    expect(split).toEqual({
      backendAmount: '7.01',
      frontendAmount: '3.00',
    });
    expect(Number(split.backendAmount) + Number(split.frontendAmount)).toBeCloseTo(10.01);
  });
});
