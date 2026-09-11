import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import {
  assertExpensePlanStatus,
  assertExpensePlanStatusTransition,
  expensePlanStatusUpdateData,
  parseExpensePlanStatusQuery,
} from './expense-plan-status';

describe('assertExpensePlanStatus', () => {
  it('accepts known statuses', () => {
    expect(() => assertExpensePlanStatus('ACTIVE')).not.toThrow();
    expect(() => assertExpensePlanStatus('CANCELLED')).not.toThrow();
  });

  it('rejects unknown status', () => {
    expect(() => assertExpensePlanStatus('PAUSED')).toThrow(BadRequestException);
  });
});

describe('assertExpensePlanStatusTransition', () => {
  it('allows cancel and resume', () => {
    expect(() => assertExpensePlanStatusTransition('ACTIVE', 'CANCELLED')).not.toThrow();
    expect(() => assertExpensePlanStatusTransition('CANCELLED', 'ACTIVE')).not.toThrow();
  });

  it('rejects no-op', () => {
    expect(() => assertExpensePlanStatusTransition('ACTIVE', 'ACTIVE')).toThrow(
      BadRequestException,
    );
  });
});

describe('parseExpensePlanStatusQuery', () => {
  it('treats empty as all statuses', () => {
    expect(parseExpensePlanStatusQuery(undefined)).toBeUndefined();
    expect(parseExpensePlanStatusQuery('')).toBeUndefined();
  });

  it('parses one or many tokens', () => {
    expect(parseExpensePlanStatusQuery('ACTIVE')).toBe('ACTIVE');
    expect(parseExpensePlanStatusQuery('ACTIVE,CANCELLED')).toEqual({
      in: ['ACTIVE', 'CANCELLED'],
    });
  });
});

describe('expensePlanStatusUpdateData', () => {
  it('cancels with auto-generate off', () => {
    const data = expensePlanStatusUpdateData('CANCELLED');
    expect(data.status).toBe('CANCELLED');
    expect(data.autoGenerate).toBe(false);
    expect(data.cancelledAt).toBeInstanceOf(Date);
  });

  it('resumes without turning auto-generate back on', () => {
    expect(expensePlanStatusUpdateData('ACTIVE')).toEqual({
      status: 'ACTIVE',
      cancelledAt: null,
    });
  });
});
