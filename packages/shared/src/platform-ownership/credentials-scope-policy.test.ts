import { describe, expect, it } from 'vitest';
import { isCredentialsAllScopeMode } from './credentials-scope-policy';

describe('isCredentialsAllScopeMode', () => {
  it('is true only for CREDENTIALS ALL', () => {
    expect(isCredentialsAllScopeMode('CREDENTIALS', 'ALL')).toBe(true);
    expect(isCredentialsAllScopeMode('CREDENTIALS', 'ASSIGNED')).toBe(false);
    expect(isCredentialsAllScopeMode('DRIVE', 'ALL')).toBe(false);
  });
});
