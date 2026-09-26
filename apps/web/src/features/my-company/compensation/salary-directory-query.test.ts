import { describe, expect, it } from 'vitest';
import {
  salaryDirectoryListParams,
  salaryDirectoryRequestScope,
  salaryDirectoryShowsMissingOnly,
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
