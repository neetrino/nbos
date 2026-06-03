'use client';

import { useMemo } from 'react';
import type { CredentialVaultViewMode } from '@/features/credentials/constants/credential-vault';
import {
  categoryBoardColumnsForQuickFilter,
  filterCredentialsByQuickCategory,
} from '@/features/credentials/constants/credential-vault-categories';
import { CredentialVaultCategoryBoard } from '@/features/credentials/components/credential-vault-category-board';
import {
  CredentialVaultTable,
  type VaultListScope,
} from '@/features/credentials/components/credential-vault-table';
import { CredentialVaultTiles } from '@/features/credentials/components/credential-vault-tiles';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import type { CredentialCategoryOption } from '@/features/credentials/constants/credential-vault-categories';
import type { CredentialVaultScope } from '@/features/credentials/vault-scope';
import type { CredentialVaultTableSelectionProps } from '@/features/credentials/components/credential-vault-table';
import type { CredentialVaultTilesSelectionProps } from '@/features/credentials/components/credential-vault-tiles';

export interface CredentialsVaultMainViewProps {
  viewMode: CredentialVaultViewMode;
  credentials: CredentialListItem[];
  loading: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  boardScrollRoot?: HTMLElement | null;
  onBoardLoadMore?: () => void;
  showCreate: boolean;
  activeTab: CredentialVaultScope;
  vaultListScope: VaultListScope;
  quickCategoryChips: readonly CredentialCategoryOption[];
  activeCategory: string | null;
  passwordFlashCredentialId: string | null;
  tableSelection?: CredentialVaultTableSelectionProps;
  tilesSelection?: CredentialVaultTilesSelectionProps;
  onCreateOpen: () => void;
  onCreateInCategory: (category: string) => void;
  onOpenCredential: (id: string) => void;
  onCopyLogin: (text: string) => void;
  onCopyPassword: (id: string, criticality: string) => void;
  onRequestDelete: (id: string, name: string) => void;
  onRequestPurge: (id: string, name: string, criticality: string) => void;
  onRestored: () => void;
}

export function CredentialsVaultMainView({
  viewMode,
  credentials,
  loading,
  loadingMore,
  hasMore,
  boardScrollRoot,
  onBoardLoadMore,
  showCreate,
  activeTab,
  vaultListScope,
  quickCategoryChips,
  activeCategory,
  passwordFlashCredentialId,
  tableSelection,
  tilesSelection,
  onCreateOpen,
  onCreateInCategory,
  onOpenCredential,
  onCopyLogin,
  onCopyPassword,
  onRequestDelete,
  onRequestPurge,
  onRestored,
}: CredentialsVaultMainViewProps) {
  const boardCategoryColumns = useMemo(
    () => categoryBoardColumnsForQuickFilter(quickCategoryChips, activeCategory),
    [quickCategoryChips, activeCategory],
  );
  const boardCredentials = useMemo(
    () => filterCredentialsByQuickCategory(credentials, activeCategory, quickCategoryChips),
    [credentials, activeCategory, quickCategoryChips],
  );

  if (viewMode === 'tiles') {
    return (
      <CredentialVaultTiles
        credentials={credentials}
        loading={loading}
        showCreate={showCreate}
        onCreateOpen={onCreateOpen}
        onOpenCredential={onOpenCredential}
        onCopyLogin={onCopyLogin}
        onCopyPassword={onCopyPassword}
        passwordFlashCredentialId={passwordFlashCredentialId}
        selection={tilesSelection}
      />
    );
  }
  if (viewMode === 'category-board') {
    return (
      <CredentialVaultCategoryBoard
        credentials={boardCredentials}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        scrollRoot={boardScrollRoot}
        onLoadMore={onBoardLoadMore}
        vaultScope={activeTab}
        showCreate={showCreate}
        categoryColumns={boardCategoryColumns}
        onCreateInCategory={onCreateInCategory}
        onOpenCredential={onOpenCredential}
        onCopyLogin={onCopyLogin}
        onCopyPassword={onCopyPassword}
        passwordFlashCredentialId={passwordFlashCredentialId}
      />
    );
  }
  return (
    <CredentialVaultTable
      credentials={credentials}
      loading={loading}
      listScope={vaultListScope}
      passwordFlashCredentialId={passwordFlashCredentialId}
      onCopyLogin={onCopyLogin}
      onCopyPassword={onCopyPassword}
      onCreateOpen={onCreateOpen}
      onOpenCredential={onOpenCredential}
      showCreate={showCreate}
      selection={tableSelection}
    />
  );
}
