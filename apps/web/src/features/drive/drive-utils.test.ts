import { describe, expect, it } from 'vitest';
import type { FileAsset } from '@/lib/api/drive';
import { DRIVE_LIBRARIES } from './drive-options';
import { fileMatchesLibrary } from './drive-utils';

const projectsLibrary = DRIVE_LIBRARIES.find((l) => l.key === 'projects')!;

function fileWithLinks(
  links: { entityType: string; entityId: string; unlinkedAt?: string | null }[],
): FileAsset {
  return {
    id: 'file-1',
    displayName: 'Test',
    originalName: null,
    fileType: 'DOCUMENT',
    purpose: null,
    sourceModule: null,
    status: 'APPROVED',
    visibility: 'INTERNAL',
    confidentiality: 'CONFIDENTIAL',
    storageProvider: 'R2',
    storageKey: null,
    externalUrl: null,
    mimeType: null,
    sizeBytes: 1,
    checksum: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    versions: [],
    links: links.map((link, index) => ({
      id: `link-${index}`,
      fileAssetId: 'file-1',
      entityType: link.entityType,
      entityId: link.entityId,
      linkType: 'ATTACHMENT',
      purposeOverride: null,
      isPrimary: false,
      linkedById: null,
      linkedAt: '2026-01-01T00:00:00.000Z',
      unlinkedAt: link.unlinkedAt ?? null,
    })),
  };
}

describe('fileMatchesLibrary', () => {
  it('matches any PROJECT link without entityLink context', () => {
    const file = fileWithLinks([
      { entityType: 'PROJECT', entityId: 'project-a' },
      { entityType: 'PROJECT', entityId: 'project-b' },
    ]);
    expect(fileMatchesLibrary(file, projectsLibrary)).toBe(true);
  });

  it('matches only the requested project when entityLink is set', () => {
    const file = fileWithLinks([{ entityType: 'PROJECT', entityId: 'project-a' }]);
    expect(
      fileMatchesLibrary(file, projectsLibrary, {
        entityLink: { entityType: 'PROJECT', entityId: 'project-a' },
      }),
    ).toBe(true);
    expect(
      fileMatchesLibrary(file, projectsLibrary, {
        entityLink: { entityType: 'PROJECT', entityId: 'project-b' },
      }),
    ).toBe(false);
  });
});
