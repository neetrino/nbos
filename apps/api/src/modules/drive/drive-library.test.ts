import { describe, it, expect } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { resolveDriveLibraryEntityType } from './drive-library';

describe('resolveDriveLibraryEntityType', () => {
  it('maps SUPPORT to SUPPORT_TICKET', () => {
    expect(resolveDriveLibraryEntityType('support')).toBe('SUPPORT_TICKET');
  });

  it('rejects unknown context', () => {
    expect(() => resolveDriveLibraryEntityType('UNKNOWN')).toThrow(BadRequestException);
  });
});
