import { describe, it, expect } from 'vitest';
import { buildStorageHomeFileName } from './drive-storage-home-filename';
import {
  buildStorageHomeKey,
  buildVersionStagingKey,
  versionStagingPrefix,
} from './drive-storage-home-path';

const ORG = '00000000-0000-4000-8000-000000000001';

describe('drive storage home paths', () => {
  it('builds tenant-scoped storage home key', () => {
    const key = buildStorageHomeKey(ORG, 'projects/project-P1-site/_project/files', 'doc.pdf');
    expect(key).toBe(`nbos/tenants/${ORG}/files/projects/project-P1-site/_project/files/doc.pdf`);
  });

  it('builds canon filename with date, purpose, id and version', () => {
    const name = buildStorageHomeFileName({
      uploadedAt: new Date('2026-05-18T12:00:00.000Z'),
      purpose: 'OFFER_APPROVED',
      displayName: 'Marco Offer.pdf',
      fileAssetId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      versionNumber: 1,
    });
    expect(name).toMatch(/^2026-05-18__offer-approved__/);
    expect(name).toMatch(/__v1\.pdf$/);
  });

  it('builds version staging prefix under tenant', () => {
    const fileId = 'file-uuid';
    const key = buildVersionStagingKey(ORG, fileId, 'upload-1', 'next.pdf');
    expect(key).toBe(`nbos/tenants/${ORG}/_staging/versions/${fileId}/upload-1/next.pdf`);
    expect(versionStagingPrefix(ORG, fileId)).toBe(
      `nbos/tenants/${ORG}/_staging/versions/${fileId}/`,
    );
  });
});
