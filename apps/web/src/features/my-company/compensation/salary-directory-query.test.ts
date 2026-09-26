import { describe, expect, it } from 'vitest';
import {
  salaryDirectoryChipCounts,
  salaryDirectoryListParams,
  salaryDirectoryRequestScope,
  salaryDirectoryShowsMissingOnly,
  salaryEmployeeVisible,
} from './salary-directory-query';

describe('salaryDirectoryListParams', () => {
  it('excludes terminated people for the default and missing-salary views', () => {
    expect(salaryDirectoryListParams('all').excludeStatus).toBe('TERMINATED');
    expect(salaryDirectoryListParams('missing').excludeStatus).toBe('TERMINATED');
    expect(salaryDirectoryShowsMissingOnly('missing')).toBe(true);
    expect(salaryDirectoryRequestScope('missing')).toBe('all');
  });

  it('loads only terminated people from that chip', () => {
    expect(salaryDirectoryListParams('terminated').status).toBe('TERMINATED');
  });

  it('loads every status when include-terminated is selected', () => {
    const params = salaryDirectoryListParams('everyone');
    expect(params.status).toBeUndefined();
    expect(params.excludeStatus).toBeUndefined();
  });
});

describe('salaryDirectoryChipCounts', () => {
  const people = [
    { status: 'ACTIVE', hasSalary: true },
    { status: 'PROBATION', hasSalary: false },
    { status: 'TERMINATED', hasSalary: false },
  ];

  it('counts everyone except terminated on All, and missing salaries among them', () => {
    expect(salaryDirectoryChipCounts(people)).toEqual({
      all: 2,
      missing: 1,
      terminated: 1,
      everyone: 3,
    });
  });

  it('keeps terminated people off the default and missing views', () => {
    expect(salaryEmployeeVisible('all', 'TERMINATED', false)).toBe(false);
    expect(salaryEmployeeVisible('missing', 'ACTIVE', false)).toBe(true);
    expect(salaryEmployeeVisible('missing', 'ACTIVE', true)).toBe(false);
    expect(salaryEmployeeVisible('everyone', 'TERMINATED', false)).toBe(true);
  });
});
