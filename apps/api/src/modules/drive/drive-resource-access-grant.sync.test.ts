import { describe, expect, it } from 'vitest';
import {
  buildDriveGrantReason,
  mapFileGrantToPlatformLevel,
  parseDriveGrantPermissionFromReason,
} from './drive-resource-access-grant.sync';

describe('drive-resource-access-grant.sync', () => {
  it('maps file grant permissions to platform levels', () => {
    expect(mapFileGrantToPlatformLevel('VIEW')).toBe('VIEW');
    expect(mapFileGrantToPlatformLevel('EXPORT')).toBe('VIEW');
    expect(mapFileGrantToPlatformLevel('SHARE')).toBe('EDIT');
  });

  it('round-trips drive permission in grant reason', () => {
    const reason = buildDriveGrantReason('SHARE', 'Client review');
    expect(parseDriveGrantPermissionFromReason(reason)).toBe('SHARE');
  });
});
