import { describe, expect, it } from 'vitest';
import {
  rolePermissionSaveConfirmCopy,
  rolePermissionSaveConfirmLevel,
} from './role-permission-save-confirm';

describe('rolePermissionSaveConfirmLevel', () => {
  it('uses strong copy-paste confirm for system roles', () => {
    expect(rolePermissionSaveConfirmLevel(true)).toBe('strong');
    expect(rolePermissionSaveConfirmCopy(true).title).toContain('system role');
  });

  it('uses a simple yes popup for custom roles', () => {
    expect(rolePermissionSaveConfirmLevel(false)).toBe('simple');
    expect(rolePermissionSaveConfirmCopy(false).title).toBe('Save role permissions?');
  });
});
