'use client';

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
import { CredentialQuickFilterChips } from '@/features/credentials/components/credential-quick-filter-chips';
import { CredentialVaultPagination } from '@/features/credentials/components/credential-vault-pagination';
import { CredentialVaultBulkBar } from '@/features/credentials/components/credential-vault-bulk-bar';
import { CredentialVaultRecentStrip } from '@/features/credentials/components/credential-vault-recent-strip';
import { CredentialsVaultMainView } from '@/features/credentials/components/credentials-vault-main-view';
import { CredentialsVaultPageOverlays } from '@/features/credentials/components/credentials-vault-page-overlays';
import { useCredentialVaultOpenQuery } from '@/features/credentials/hooks/use-credential-vault-open-query';
import { useCredentialsVaultPage } from '@/features/credentials/hooks/use-credentials-vault-page';
import { CredentialsPageSettingsSheet } from '@/features/credentials/components/credentials-page-settings-sheet';
import { PermissionGate } from '@/lib/permissions';

export function CredentialsVaultPage() {
  const vault = useCredentialsVaultPage();

  useCredentialVaultOpenQuery(vault.openCredential);

  const handlePasswordCopied = (flashId: string) => {
    vault.setPasswordFlashCredentialId(flashId);
    window.setTimeout(() => {
      vault.setPasswordFlashCredentialId((current) => (current === flashId ? null : current));
    }, CREDENTIAL_VAULT_COPY_FEEDBACK_MS);
  };

  const handleSaved = () => {
    void vault.fetchCredentials();
    void vault.refreshRecent();
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
            filterValues={vault.filters}
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
            <span className="text-muted-foreground hidden text-xs tabular-nums sm:inline">
              {vault.total} credentials
            </span>
            <Button
              type="button"
              variant={vault.vaultListScope === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => vault.setVaultListScope('active')}
            >
              Active
            </Button>
            <Button
              type="button"
              variant={vault.vaultListScope === 'archived' ? 'default' : 'outline'}
              size="sm"
              onClick={() => vault.setVaultListScope('archived')}
            >
              Archived
            </Button>
            {vault.vaultListScope === 'active' && (
              <PermissionGate module="CREDENTIALS" action="VIEW">
                <CredentialsPageSettingsSheet />
              </PermissionGate>
            )}
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

      <CredentialQuickFilterChips
        vaultScope={vault.activeTab}
        categoryChips={vault.quickCategoryChips}
        activeCategory={vault.quickCategory}
        onCategoryChange={vault.setQuickCategory}
        activeQuick={vault.quickFilters}
        onToggleQuick={vault.toggleQuickFilter}
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

      {vault.showRecentBlock && (
        <CredentialVaultRecentStrip
          credentials={vault.recentCredentials}
          loading={vault.recentLoading}
          searchActive={vault.searchQuery.length > 0}
          onOpenCredential={vault.openCredential}
          onCopyLogin={vault.copyToClipboard}
          onCopyPassword={vault.setTileCopyCredentialId}
          passwordFlashCredentialId={vault.passwordFlashCredentialId}
        />
      )}

      <div
        className={vault.viewMode === 'category-board' ? 'flex min-h-0 flex-1 flex-col' : undefined}
      >
        <CredentialsVaultMainView
          viewMode={vault.viewMode}
          credentials={vault.credentials}
          loading={vault.loading}
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

      <CredentialVaultPagination
        page={vault.page}
        totalPages={vault.totalPages}
        total={vault.total}
        onPageChange={vault.setPage}
      />

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
