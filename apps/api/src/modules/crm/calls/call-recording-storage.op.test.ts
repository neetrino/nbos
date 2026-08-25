import { describe, expect, it } from 'vitest';
import { hasDriveViewPermission } from './call-recording-storage.op';

describe('hasDriveViewPermission', () => {
  it('allows OWN and ALL', () => {
    expect(hasDriveViewPermission({ DRIVE_VIEW: 'OWN' })).toBe(true);
    expect(hasDriveViewPermission({ DRIVE_VIEW: 'all' })).toBe(true);
  });

  it('rejects missing and NONE', () => {
    expect(hasDriveViewPermission({})).toBe(false);
    expect(hasDriveViewPermission({ DRIVE_VIEW: 'NONE' })).toBe(false);
    expect(hasDriveViewPermission({ DRIVE_VIEW: '  ' })).toBe(false);
  });
});
