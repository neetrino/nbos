'use client';

import { useCallback, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  PageHero,
  PageHeroTabs,
  IntegratedSearchFilters,
  ViewModeSwitch,
} from '@/components/shared';
import { CREDENTIAL_VAULT_VIEW_OPTIONS } from '@/features/credentials/constants/credential-vault';
import { CREDENTIAL_VAULT_COPY_FEEDBACK_MS } from '@/features/credentials/constants/credential-vault-copy';
import { CREDENTIAL_VAULT_TAB_OPTIONS } from '@/features/credentials/constants/credentials-vault-page-constants';
import { CredentialVaultArchivedBanner } from '@/features/credentials/components/credential-vault-archived-banner';
import { CredentialQuickFilterChips } from '@/features/credentials/components/credential-quick-filter-chips';
import { CredentialVaultPaginationFooter } from '@/features/credentials/components/credential-vault-pagination-footer';
import { CredentialVaultBulkBar } from '@/features/credentials/components/credential-vault-bulk-bar';
import { CredentialsVaultMainView } from '@/features/credentials/components/credentials-vault-main-view';
import { CredentialsVaultPageOverlays } from '@/features/credentials/components/credentials-vault-page-overlays';
import { useCredentialVaultOpenQuery } from '@/features/credentials/hooks/use-credential-vault-open-query';
import { useCredentialsVaultPage } from '@/features/credentials/hooks/use-credentials-vault-page';
import { CredentialsPageSettingsSheet } from '@/features/credentials/components/credentials-page-settings-sheet';
import { PermissionGate } from '@/lib/permissions';

export function CredentialsVaultPage() {
  const vault = useCredentialsVaultPage();
  const [boardScrollRoot, setBoardScrollRoot] = useState<HTMLElement | null>(null);
  const bindBoardScrollContainer = useCallback((node: HTMLDivElement | null) => {
    setBoardScrollRoot(node);
  }, []);

  useCredentialVaultOpenQuery(vault.openCredential);

  const handlePasswordCopied = (flashId: string) => {
    vault.setPasswordFlashCredentialId(flashId);
    window.setTimeout(() => {
      vault.setPasswordFlashCredentialId((current) => (current === flashId ? null : current));
    }, CREDENTIAL_VAULT_COPY_FEEDBACK_MS);
  };

  const handleSaved = () => {
    void vault.fetchCredentials();
  };

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHero
        title="Credentials Vault"
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

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <CredentialQuickFilterChips
          vaultScope={vault.activeTab}
          categoryChips={vault.quickCategoryChips}
          activeCategory={vault.quickCategory}
          onCategoryChange={vault.setQuickCategory}
          activeQuick={vault.quickFilters}
          onToggleQuick={vault.toggleQuickFilter}
        />
        <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
          {vault.total} credentials
        </span>
      </div>

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
          visibleLogins={vault.visibleLogins}
          quickCategoryChips={vault.quickCategoryChips}
          passwordFlashCredentialId={vault.passwordFlashCredentialId}
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
          onCopyLogin={vault.copyToClipboard}
          onCopyPassword={vault.setTileCopyCredentialId}
          onToggleLogin={vault.toggleLogin}
          onCopy={vault.copyToClipboard}
          onRequestDelete={(id, name) => vault.setDeleteTarget({ id, name })}
          onRequestPurge={(id, name, criticality) =>
            vault.setPurgeTarget({ id, name, criticality })
          }
          onRestored={handleSaved}
        />
      </div>

      {vault.showPagedFooter ? (
        <CredentialVaultPaginationFooter
          page={vault.page}
          pageSize={vault.pageSize}
          total={vault.total}
          totalPages={vault.totalPages}
          onPageChange={vault.setPage}
          onPageSizeChange={vault.setPageSize}
        />
      ) : null}

      <CredentialsVaultPageOverlays
        activeTab={vault.activeTab}
        sheetOpen={vault.sheetOpen}
        sheetCredentialId={vault.sheetCredentialId}
        createPresetCategory={vault.createPresetCategory}
        deleteTarget={vault.deleteTarget}
        purgeTarget={vault.purgeTarget}
        tileCopyCredentialId={vault.tileCopyCredentialId}
        onCloseSheet={vault.closeSheet}
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
          if (!open) vault.setTileCopyCredentialId(null);
        }}
        onPasswordCopied={handlePasswordCopied}
      />
    </div>
  );
}
