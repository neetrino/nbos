import { describe, expect, it } from 'vitest';
import type { CredentialFolder } from '@/lib/api/credentials';
import {
  credentialMatchesFolder,
  credentialFoldersForVaultTab,
  filterCredentialFoldersForContext,
  folderListScopeParamForVaultTab,
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
    folder('company-1', 'ALL'),
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

  it('uses company vault scope for ALL access folders on create', () => {
    const result = filterCredentialFoldersForContext(all, {
      isCreate: true,
      vaultScope: 'company',
    });
    expect(result.map((f) => f.id)).toEqual(['company-1']);
  });

  it('maps ALL access level to company folders on edit', () => {
    const result = filterCredentialFoldersForContext(all, {
      isCreate: false,
      accessLevel: 'ALL',
    });
    expect(result.map((f) => f.id)).toEqual(['company-1']);
  });

  it('rejects cross-section drag targets', () => {
    const teamCred = { accessLevel: 'DEPARTMENT', projectId: null };
    expect(credentialMatchesFolder(teamCred, folder('team-1', 'TEAM'))).toBe(true);
    expect(credentialMatchesFolder(teamCred, folder('secret-1', 'SECRET'))).toBe(false);
  });
});

describe('folderListScopeParamForVaultTab', () => {
  it('uses ALL query for vault All and Company tabs', () => {
    expect(folderListScopeParamForVaultTab('all')).toBe('ALL');
    expect(folderListScopeParamForVaultTab('company')).toBe('ALL');
  });

  it('maps scoped tabs to folder scope params', () => {
    expect(folderListScopeParamForVaultTab('team')).toBe('TEAM');
  });
});

describe('credentialFoldersForVaultTab', () => {
  const folders = [folder('team-1', 'TEAM'), folder('company-1', 'ALL')];

  it('narrows company tab to ALL scope folders only', () => {
    expect(credentialFoldersForVaultTab(folders, 'company').map((f) => f.id)).toEqual([
      'company-1',
    ]);
  });

  it('returns all folders for vault All tab', () => {
    expect(credentialFoldersForVaultTab(folders, 'all')).toEqual(folders);
  });
});
