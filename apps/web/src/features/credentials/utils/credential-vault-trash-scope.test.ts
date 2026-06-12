import { describe, expect, it } from 'vitest';

/** Mirrors trash-scope guards in `use-credentials-vault-page` (C0.2–C0.3). */
function shouldSkipVaultFolderEndpoints(vaultListScope: 'active' | 'trash'): boolean {
  return vaultListScope === 'trash';
}

function resolveTrashViewMode(
  viewMode: 'list' | 'tiles' | 'table' | 'folders' | 'category-board',
  vaultListScope: 'active' | 'trash',
): typeof viewMode {
  if (vaultListScope === 'trash' && viewMode === 'folders') return 'list';
  return viewMode;
}

describe('credential vault trash scope', () => {
  it('skips folder and project shell fetches in trash', () => {
    expect(shouldSkipVaultFolderEndpoints('trash')).toBe(true);
    expect(shouldSkipVaultFolderEndpoints('active')).toBe(false);
  });

  it('forces list view when entering trash from folders mode', () => {
    expect(resolveTrashViewMode('folders', 'trash')).toBe('list');
    expect(resolveTrashViewMode('tiles', 'trash')).toBe('tiles');
    expect(resolveTrashViewMode('folders', 'active')).toBe('folders');
  });
});
