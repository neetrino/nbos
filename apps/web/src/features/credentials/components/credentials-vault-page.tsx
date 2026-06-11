'use client';

import { useCallback, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  PageHero,
  PageHeroTabs,
  IntegratedSearchFilters,
  ViewModeSwitch,
  ListPagination,
} from '@/components/shared';
import { CREDENTIAL_VAULT_VIEW_OPTIONS } from '@/features/credentials/constants/credential-vault';
import { CREDENTIAL_VAULT_COPY_FEEDBACK_MS } from '@/features/credentials/constants/credential-vault-copy';
import { CREDENTIAL_VAULT_TAB_OPTIONS } from '@/features/credentials/constants/credentials-vault-page-constants';
import { CredentialVaultArchivedBanner } from '@/features/credentials/components/credential-vault-archived-banner';
import { CredentialQuickFilterChips } from '@/features/credentials/components/credential-quick-filter-chips';
import { CredentialFolderCreateButton } from '@/features/credentials/components/credential-folder-create-button';
import { CredentialVaultBulkBar } from '@/features/credentials/components/credential-vault-bulk-bar';
import { CredentialsVaultMainView } from '@/features/credentials/components/credentials-vault-main-view';
import { CredentialsVaultPageOverlays } from '@/features/credentials/components/credentials-vault-page-overlays';
import { CredentialVaultSessionProvider } from '@/features/credentials/hooks/use-credential-vault-session';
import { useVaultPasswordCopy } from '@/features/credentials/hooks/use-vault-password-copy';
import { useCredentialsVaultPage } from '@/features/credentials/hooks/use-credentials-vault-page';
import { CredentialsPageSettingsSheet } from '@/features/credentials/components/credentials-page-settings-sheet';
import { PermissionGate } from '@/lib/permissions';

export function CredentialsVaultPage() {
  return (
    <CredentialVaultSessionProvider>
      <CredentialsVaultPageContent />
    </CredentialVaultSessionProvider>
  );
}

function CredentialsVaultPageContent() {
  const vault = useCredentialsVaultPage();
  const [boardScrollRoot, setBoardScrollRoot] = useState<HTMLElement | null>(null);
  const bindBoardScrollContainer = useCallback((node: HTMLDivElement | null) => {
    setBoardScrollRoot(node);
  }, []);

  const handleSecretCopied = (flashId: string) => {
    vault.setPasswordFlashCredentialId(flashId);
    window.setTimeout(() => {
      vault.setPasswordFlashCredentialId((current) => (current === flashId ? null : current));
    }, CREDENTIAL_VAULT_COPY_FEEDBACK_MS);
  };

  const copyVaultSecret = useVaultPasswordCopy(vault.setTileCopyTarget, handleSecretCopied);

  const handleSaved = () => {
    void vault.fetchCredentials({ silent: true });
    void vault.fetchFolders();
  };

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHero
        title={
          vault.vaultListScope === 'archived' ? 'Credentials Vault — Archived' : 'Credentials Vault'
        }
        tabs={
          <PageHeroTabs
            value={vault.activeTab}
            onChange={vault.handleTabChange}
            options={CREDENTIAL_VAULT_TAB_OPTIONS}
            ariaLabel="Credential scope"
          />
        }
        search={
          <IntegratedSearchFilters
            search={vault.search}
            onSearchChange={vault.setSearch}
            searchPlaceholder="Search by name, provider…"
            filters={vault.filterConfigs}
            filterValues={vault.filterValuesForUi}
            onFilterChange={(key, value) => vault.setFilters((prev) => ({ ...prev, [key]: value }))}
            onClearAll={vault.clearFilters}
          />
        }
        viewMode={
          <ViewModeSwitch
            value={vault.viewMode}
            onChange={vault.setViewMode}
            options={CREDENTIAL_VAULT_VIEW_OPTIONS}
          />
        }
        trailing={
          <>
            <PermissionGate module="CREDENTIALS" action="VIEW">
              <CredentialsPageSettingsSheet
                vaultListScope={vault.vaultListScope}
                onVaultListScopeChange={vault.setVaultListScope}
              />
            </PermissionGate>
            {vault.showCreate && (
              <PermissionGate module="CREDENTIALS" action="ADD">
                <Button type="button" onClick={() => vault.openCreate()}>
                  <Plus size={16} aria-hidden />
                  New Credential
                </Button>
              </PermissionGate>
            )}
          </>
        }
      />

      {vault.vaultListScope === 'archived' ? (
        <CredentialVaultArchivedBanner onBackToVault={() => vault.setVaultListScope('active')} />
      ) : null}

      <CredentialQuickFilterChips
        vaultScope={vault.activeTab}
        categoryChips={vault.quickCategoryChips}
        activeCategory={vault.quickCategory}
        onCategoryChange={vault.setQuickCategory}
        activeQuick={vault.quickFilters}
        onToggleQuick={vault.toggleQuickFilter}
        trailing={
          vault.viewMode === 'folders' && vault.showCreate ? (
            <CredentialFolderCreateButton onCreateFolder={vault.createFolder} />
          ) : undefined
        }
      />

      {vault.selection.selectionActive && (
        <CredentialVaultBulkBar
          count={vault.selection.selectedCount}
          archivedList={vault.vaultListScope === 'archived'}
          busy={vault.loading}
          showSelectAll={vault.pageCredentialIds.length > 0}
          selectedIds={vault.selection.selectedIdList}
          onSelectAll={vault.selection.selectAllOnPage}
          onClear={vault.selection.clearSelection}
          onCompleted={handleSaved}
        />
      )}

      <div
        ref={vault.viewMode === 'category-board' ? bindBoardScrollContainer : undefined}
        className={
          vault.viewMode === 'category-board'
            ? 'flex min-h-0 flex-1 flex-col overflow-y-auto'
            : undefined
        }
      >
        <CredentialsVaultMainView
          viewMode={vault.viewMode}
          credentials={vault.credentials}
          loading={vault.loading}
          loadingMore={vault.loadingMore}
          hasMore={vault.hasMore}
          boardScrollRoot={boardScrollRoot}
          onBoardLoadMore={vault.loadMore}
          showCreate={vault.showCreate}
          activeTab={vault.activeTab}
          vaultListScope={vault.vaultListScope}
          quickCategoryChips={vault.quickCategoryChips}
          activeCategory={vault.quickCategory}
          secretFlashCredentialId={vault.passwordFlashCredentialId}
          tableSelection={
            vault.selectionEnabled
              ? {
                  enabled: true,
                  selectionActive: vault.selection.selectionActive,
                  isSelected: vault.selection.isSelected,
                  onToggle: vault.selection.toggleSelected,
                  onTogglePage: vault.selection.selectAllOnPage,
                  pageIds: vault.pageCredentialIds,
                }
              : undefined
          }
          tilesSelection={
            vault.selectionEnabled
              ? {
                  enabled: true,
                  selectionActive: vault.selection.selectionActive,
                  isSelected: vault.selection.isSelected,
                  onToggle: vault.selection.toggleSelected,
                }
              : undefined
          }
          onCreateOpen={() => vault.openCreate()}
          onCreateInCategory={(cat) => vault.openCreate(cat)}
          onOpenCredential={vault.openCredential}
          onSetFavorite={(id, favorite) => void vault.setCredentialFavorite(id, favorite)}
          onCopyText={vault.copyToClipboard}
          onCopySecret={(id, criticality, field) =>
            void copyVaultSecret({ id, criticality, field })
          }
          onRequestDelete={(id, name) => vault.setDeleteTarget({ id, name })}
          onRequestPurge={(id, name, criticality) =>
            vault.setPurgeTarget({ id, name, criticality })
          }
          onRestored={handleSaved}
        />
      </div>

      {vault.showPagedFooter ? (
        <ListPagination
          meta={{
            total: vault.total,
            page: vault.page,
            pageSize: vault.pageSize,
            totalPages: vault.totalPages,
          }}
          onPageChange={vault.setPage}
        />
      ) : null}

      <CredentialsVaultPageOverlays
        activeTab={vault.activeTab}
        sheetOpen={vault.sheetOpen}
        sheetCredentialId={vault.sheetCredentialId}
        sheetInitialItem={vault.sheetInitialItem}
        createPresetCategory={vault.createPresetCategory}
        initialFolderId={vault.activeFolderId}
        folderOptions={vault.folders}
        deleteTarget={vault.deleteTarget}
        purgeTarget={vault.purgeTarget}
        tileCopyTarget={vault.tileCopyTarget}
        onCloseSheet={vault.closeSheet}
        onCredentialCreated={vault.handleCredentialCreated}
        onSaved={handleSaved}
        onRequestArchive={(id, name) => {
          vault.closeSheet(false);
          vault.setDeleteTarget({ id, name });
        }}
        onDeleteTargetChange={(open) => {
          if (!open) vault.setDeleteTarget(null);
        }}
        onPurgeTargetChange={(open) => {
          if (!open) vault.setPurgeTarget(null);
        }}
        onTileCopyOpenChange={(open) => {
          if (!open) vault.setTileCopyTarget(null);
        }}
        onTileCopyConfirm={async (pwd) => {
          if (!vault.tileCopyTarget) return;
          await copyVaultSecret(vault.tileCopyTarget, pwd);
          vault.setTileCopyTarget(null);
        }}
      />
    </div>
  );
}
