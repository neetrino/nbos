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
import { CredentialVaultFoldersView } from '@/features/credentials/components/credential-vault-folders-view';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import type {
  CredentialFolder,
  CredentialProjectShell,
  CredentialSecretField,
} from '@/lib/api/credentials';
import type { CredentialFolderMatchInput } from '@/features/credentials/utils/credential-folder-scope';
import type { CredentialCategoryOption } from '@/features/credentials/constants/credential-vault-categories';
import type { CredentialVaultScope } from '@/features/credentials/vault-scope';
import type { CredentialVaultTableSelectionProps } from '@/features/credentials/components/credential-vault-table';
import type { CredentialVaultTilesSelectionProps } from '@/features/credentials/components/credential-vault-tiles';
import type { CredentialVaultCardDragConfig } from '@/features/credentials/utils/credential-vault-drag';

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
  secretFlashCredentialId: string | null;
  tableSelection?: CredentialVaultTableSelectionProps;
  tilesSelection?: CredentialVaultTilesSelectionProps;
  onCreateOpen: () => void;
  onCreateInCategory: (category: string) => void;
  onOpenCredential: (id: string) => void;
  onSetFavorite?: (id: string, favorite: boolean) => void;
  onCopyText: (text: string) => void;
  onCopySecret: (id: string, criticality: string, field: CredentialSecretField) => void;
  onRequestDelete: (id: string, name: string) => void;
  onRequestPurge: (id: string, name: string, criticality: string) => void;
  onRestored: () => void;
  folders?: CredentialFolder[];
  foldersLoading?: boolean;
  activeFolderId?: string | null;
  onNavigateFolder?: (folderId: string | null) => void;
  onOpenFolder?: (folderId: string) => void;
  onRenameFolder?: (folderId: string, name: string) => Promise<void>;
  onDeleteFolder?: (folderId: string) => Promise<void>;
  projectShellsMode?: boolean;
  projectShells?: CredentialProjectShell[];
  projectShellsLoading?: boolean;
  activeProject?: { id: string; name: string } | null;
  onOpenProject?: (projectId: string) => void;
  onNavigateProject?: (projectId: string | null) => void;
  credentialFolderDrag?: CredentialVaultCardDragConfig;
  credentialFolderDrop?: {
    busy?: boolean;
    draggingCredentialIds: readonly string[];
    resolveCredential: (credentialId: string) => CredentialFolderMatchInput | null | undefined;
    onMoveCredentialsToFolder: (credentialIds: string[], folderId: string) => void | Promise<void>;
  };
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
  secretFlashCredentialId,
  tableSelection,
  tilesSelection,
  onCreateOpen,
  onCreateInCategory,
  onOpenCredential,
  onSetFavorite,
  onCopyText,
  onCopySecret,
  onRequestDelete,
  folders = [],
  foldersLoading = false,
  activeFolderId = null,
  onNavigateFolder,
  onOpenFolder,
  onRenameFolder,
  onDeleteFolder,
  projectShellsMode,
  projectShells,
  projectShellsLoading,
  activeProject,
  onOpenProject,
  onNavigateProject,
  credentialFolderDrag,
  credentialFolderDrop,
}: CredentialsVaultMainViewProps) {
  const boardCategoryColumns = useMemo(
    () => categoryBoardColumnsForQuickFilter(quickCategoryChips, activeCategory),
    [quickCategoryChips, activeCategory],
  );
  const boardCredentials = useMemo(
    () => filterCredentialsByQuickCategory(credentials, activeCategory, quickCategoryChips),
    [credentials, activeCategory, quickCategoryChips],
  );

  const canMoveToTrashCredential = showCreate && vaultListScope === 'active';

  if (viewMode === 'tiles') {
    return (
      <CredentialVaultTiles
        credentials={credentials}
        loading={loading}
        showCreate={showCreate}
        onCreateOpen={onCreateOpen}
        onOpenCredential={onOpenCredential}
        onSetFavorite={onSetFavorite}
        onRequestMoveToTrash={canMoveToTrashCredential ? onRequestDelete : undefined}
        canMoveToTrash={canMoveToTrashCredential}
        onCopyText={onCopyText}
        onCopySecret={onCopySecret}
        secretFlashCredentialId={secretFlashCredentialId}
        selection={tilesSelection}
      />
    );
  }
  if (viewMode === 'folders') {
    return (
      <CredentialVaultFoldersView
        folders={folders}
        foldersLoading={foldersLoading}
        activeFolderId={activeFolderId}
        credentials={credentials}
        credentialsLoading={loading}
        showCreate={showCreate}
        selection={tilesSelection}
        onNavigateFolder={onNavigateFolder ?? (() => undefined)}
        onOpenFolder={onOpenFolder ?? (() => undefined)}
        onRenameFolder={onRenameFolder ?? (async () => undefined)}
        onDeleteFolder={onDeleteFolder ?? (async () => undefined)}
        projectShellsMode={projectShellsMode}
        projectShells={projectShells}
        projectShellsLoading={projectShellsLoading}
        activeProject={activeProject}
        onOpenProject={onOpenProject}
        onNavigateProject={onNavigateProject}
        onCreateOpen={onCreateOpen}
        onOpenCredential={onOpenCredential}
        onSetFavorite={onSetFavorite}
        onRequestMoveToTrash={canMoveToTrashCredential ? onRequestDelete : undefined}
        canMoveToTrash={canMoveToTrashCredential}
        onCopyText={onCopyText}
        onCopySecret={onCopySecret}
        secretFlashCredentialId={secretFlashCredentialId}
        credentialDrag={credentialFolderDrag}
        credentialFolderDrop={credentialFolderDrop}
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
        onSetFavorite={onSetFavorite}
        onRequestMoveToTrash={canMoveToTrashCredential ? onRequestDelete : undefined}
        canMoveToTrash={canMoveToTrashCredential}
        onCopyText={onCopyText}
        onCopySecret={onCopySecret}
        secretFlashCredentialId={secretFlashCredentialId}
      />
    );
  }
  return (
    <CredentialVaultTable
      credentials={credentials}
      loading={loading}
      listScope={vaultListScope}
      secretFlashCredentialId={secretFlashCredentialId}
      onCopyText={onCopyText}
      onCopySecret={onCopySecret}
      onCreateOpen={onCreateOpen}
      onOpenCredential={onOpenCredential}
      onSetFavorite={onSetFavorite}
      showCreate={showCreate}
      selection={tableSelection}
    />
  );
}
