import { describe, expect, it } from 'vitest';
import {
  isResourceGrantResourceType,
  RESOURCE_GRANT_RESOURCE_TYPE,
  RESOURCE_GRANT_RESOURCE_TYPES,
} from './constants';

describe('RESOURCE_GRANT_RESOURCE_TYPES', () => {
  it('lists shipped grant resource types', () => {
    expect(RESOURCE_GRANT_RESOURCE_TYPES).toEqual([
      'credential',
      'drive_file_asset',
      'drive_folder',
    ]);
  });

  it('validates known resource types', () => {
    expect(isResourceGrantResourceType(RESOURCE_GRANT_RESOURCE_TYPE.DRIVE_FOLDER)).toBe(true);
    expect(isResourceGrantResourceType('finance_invoice')).toBe(false);
  });
});
