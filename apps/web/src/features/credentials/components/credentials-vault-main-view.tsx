'use client';

import type { CredentialVaultViewMode } from '@/features/credentials/constants/credential-vault';
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
  visibleLogins: Set<string>;
  quickCategoryChips: readonly CredentialCategoryOption[];
  passwordFlashCredentialId: string | null;
  tableSelection?: CredentialVaultTableSelectionProps;
  tilesSelection?: CredentialVaultTilesSelectionProps;
  onCreateOpen: () => void;
  onCreateInCategory: (category: string) => void;
  onOpenCredential: (id: string) => void;
  onCopyLogin: (text: string) => void;
  onCopyPassword: (id: string) => void;
  onToggleLogin: (id: string) => void;
  onCopy: (text: string) => void;
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
  visibleLogins,
  quickCategoryChips,
  passwordFlashCredentialId,
  tableSelection,
  tilesSelection,
  onCreateOpen,
  onCreateInCategory,
  onOpenCredential,
  onCopyLogin,
  onCopyPassword,
  onToggleLogin,
  onCopy,
  onRequestDelete,
  onRequestPurge,
  onRestored,
}: CredentialsVaultMainViewProps) {
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
        credentials={credentials}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        scrollRoot={boardScrollRoot}
        onLoadMore={onBoardLoadMore}
        vaultScope={activeTab}
        showCreate={showCreate}
        categoryColumns={quickCategoryChips}
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
      visibleLogins={visibleLogins}
      onToggleLogin={onToggleLogin}
      onCopy={onCopy}
      onCreateOpen={onCreateOpen}
      onOpenCredential={onOpenCredential}
      onRequestDelete={onRequestDelete}
      onRequestPurge={onRequestPurge}
      onRestored={onRestored}
      showCreate={showCreate}
      selection={tableSelection}
    />
  );
}
