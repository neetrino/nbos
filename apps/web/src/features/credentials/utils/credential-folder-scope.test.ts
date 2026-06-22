import { describe, expect, it } from 'vitest';
import type { CredentialFolder } from '@/lib/api/credentials';
import {
  credentialMatchesFolder,
  filterCredentialFoldersForContext,
} from '@/features/credentials/utils/credential-folder-scope';

const folder = (
  id: string,
  scope: CredentialFolder['scope'],
  projectId: string | null = null,
): CredentialFolder => ({
  id,
  name: id,
  scope,
  projectId,
  parentId: null,
  sortOrder: 0,
  credentialCount: 0,
});

describe('filterCredentialFoldersForContext', () => {
  const all = [
    folder('my-1', 'MY'),
    folder('team-1', 'TEAM'),
    folder('proj-a', 'PROJECT', 'project-a'),
    folder('proj-b', 'PROJECT', 'project-b'),
    folder('secret-1', 'SECRET'),
  ];

  it('filters edit folders by credential access level, not vault tab', () => {
    const result = filterCredentialFoldersForContext(all, {
      isCreate: false,
      vaultScope: 'all',
      accessLevel: 'DEPARTMENT',
    });
    expect(result.map((f) => f.id)).toEqual(['team-1']);
  });

  it('limits project folders to the credential project', () => {
    const result = filterCredentialFoldersForContext(all, {
      isCreate: false,
      accessLevel: 'PROJECT_TEAM',
      projectId: 'project-a',
    });
    expect(result.map((f) => f.id)).toEqual(['proj-a']);
  });

  it('uses vault scope for create', () => {
    const result = filterCredentialFoldersForContext(all, {
      isCreate: true,
      vaultScope: 'secret',
    });
    expect(result.map((f) => f.id)).toEqual(['secret-1']);
  });

  it('rejects cross-section drag targets', () => {
    const teamCred = { accessLevel: 'DEPARTMENT', projectId: null };
    expect(credentialMatchesFolder(teamCred, folder('team-1', 'TEAM'))).toBe(true);
    expect(credentialMatchesFolder(teamCred, folder('secret-1', 'SECRET'))).toBe(false);
  });
});
