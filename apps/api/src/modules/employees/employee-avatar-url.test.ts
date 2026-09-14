import { describe, expect, it } from 'vitest';
import { buildEmployeeAvatarDisplayUrl } from './employee-avatar-url';

describe('buildEmployeeAvatarDisplayUrl', () => {
  it('builds a same-origin cache-busted path', () => {
    expect(buildEmployeeAvatarDisplayUrl('emp-1', 'file-9')).toBe(
      '/api/employees/emp-1/avatar?v=file-9',
    );
  });
});
