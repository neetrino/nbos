import { describe, it, expect } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import {
  assertNoPathTraversal,
  assertStorageKeyInTenantScope,
  normalizeSafeContextPath,
} from './storage-key-validation';

const ORG = 'org-1';

describe('storage-key-validation', () => {
  it('rejects traversal in keys', () => {
    expect(() => assertNoPathTraversal('../etc/passwd', 'storageKey')).toThrow(BadRequestException);
    expect(() => assertNoPathTraversal('a//b', 'storageKey')).toThrow(BadRequestException);
  });

  it('normalizes safe context paths', () => {
    expect(normalizeSafeContextPath('/projects/p1/files/')).toBe('projects/p1/files');
  });

  it('rejects unsafe context segments', () => {
    expect(() => normalizeSafeContextPath('projects/../secret')).toThrow(BadRequestException);
  });

  it('allows tenant-scoped storage keys', () => {
    expect(() =>
      assertStorageKeyInTenantScope(`nbos/tenants/${ORG}/files/projects/p1/doc.pdf`, ORG),
    ).not.toThrow();
  });

  it('rejects keys outside tenant scope', () => {
    expect(() => assertStorageKeyInTenantScope('nbos/tenants/other-org/files/x.pdf', ORG)).toThrow(
      BadRequestException,
    );
  });

  it('allows version staging keys for the file asset', () => {
    expect(() =>
      assertStorageKeyInTenantScope(
        `nbos/tenants/${ORG}/_staging/versions/file-1/upload/doc.pdf`,
        ORG,
        'file-1',
      ),
    ).not.toThrow();
  });
});
