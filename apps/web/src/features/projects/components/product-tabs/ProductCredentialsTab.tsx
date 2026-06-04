'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ExternalLink, KeyRound } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import {
  EmptyState,
  ErrorState,
  IntegratedSearchFilters,
  LoadingState,
  PageHero,
  ViewModeSwitch,
} from '@/components/shared';
import { CredentialFormSheet } from '@/features/credentials/components/credential-form-sheet';
import { CredentialQuickFilterChips } from '@/features/credentials/components/credential-quick-filter-chips';
import { CredentialVaultTable } from '@/features/credentials/components/credential-vault-table';
import { CredentialVaultTiles } from '@/features/credentials/components/credential-vault-tiles';
import { CredentialVaultCategoryBoard } from '@/features/credentials/components/credential-vault-category-board';
import { CredentialVaultSessionProvider } from '@/features/credentials/hooks/use-credential-vault-session';
import { useVaultPasswordCopy } from '@/features/credentials/hooks/use-vault-password-copy';
import { PRODUCT_CREDENTIALS_VIEW_OPTIONS } from '@/features/projects/constants/product-credentials-view-options';
import { useProductCredentialsViewMode } from '@/features/projects/constants/product-credentials-view-storage';
import { useProductCredentialsFilter } from '@/features/projects/hooks/use-product-credentials-filter';
import type { UseProductCredentialsTabResult } from '@/features/projects/hooks/use-product-credentials-tab';
import { useProductEntityDetailSheet } from '@/features/projects/hooks/use-product-entity-detail-sheet';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import type { CredentialSecretField } from '@/lib/api/credentials';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type ProductCredentialsTabProps = UseProductCredentialsTabResult;

export function ProductCredentialsTab({
  credentials,
  loading,
  error,
  refetch,
}: ProductCredentialsTabProps) {
  return (
    <CredentialVaultSessionProvider>
      <ProductCredentialsTabContent
        credentials={credentials}
        loading={loading}
        error={error}
        refetch={refetch}
      />
    </CredentialVaultSessionProvider>
  );
}

function ProductCredentialsTabContent({
  credentials,
  loading,
  error,
  refetch,
}: ProductCredentialsTabProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useProductCredentialsViewMode();
  const [secretFlashCredentialId, setSecretFlashCredentialId] = useState<string | null>(null);
  const [sheetInitialItem, setSheetInitialItem] = useState<CredentialListItem | null>(null);
  const credentialSheet = useProductEntityDetailSheet();
  const filter = useProductCredentialsFilter(credentials);

  const handleSecretCopied = useCallback((flashId: string) => {
    setSecretFlashCredentialId(flashId);
    window.setTimeout(() => {
      setSecretFlashCredentialId((current) => (current === flashId ? null : current));
    }, 2000);
  }, []);

  const copyVaultSecret = useVaultPasswordCopy(() => undefined, handleSecretCopied);

  const handleCopyText = useCallback((text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success('Copied');
  }, []);

  const handleCopySecret = useCallback(
    (credentialId: string, criticality: string, field: CredentialSecretField) => {
      void copyVaultSecret({ id: credentialId, criticality, field });
    },
    [copyVaultSecret],
  );

  const handleOpenCredential = useCallback(
    (id: string) => {
      const item =
        credentials.find((row) => row.id === id) ??
        filter.displayCredentials.find((row) => row.id === id) ??
        null;
      setSheetInitialItem(item);
      credentialSheet.openEntity(id);
    },
    [credentialSheet, credentials, filter.displayCredentials],
  );

  if (loading && credentials.length === 0) {
    return <LoadingState count={3} />;
  }

  if (error) {
    return <ErrorState description={error} onRetry={() => void refetch()} />;
  }

  const hasCredentials = credentials.length > 0;
  const hasVisibleCredentials = filter.displayCredentials.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <PageHero
        title="Product credentials"
        syncModuleTitle={false}
        className="mt-0"
        search={
          hasCredentials ? (
            <IntegratedSearchFilters
              search={filter.search}
              onSearchChange={filter.setSearch}
              searchPlaceholder="Search by name, provider…"
              filters={filter.filterConfigs}
              filterValues={filter.filterValuesForUi}
              onFilterChange={filter.handleFilterChange}
              onClearAll={filter.clearFilters}
            />
          ) : undefined
        }
        viewMode={
          hasCredentials ? (
            <ViewModeSwitch
              value={viewMode}
              onChange={setViewMode}
              options={PRODUCT_CREDENTIALS_VIEW_OPTIONS}
              ariaLabel="Credentials view mode"
            />
          ) : undefined
        }
        trailing={
          <Link
            href="/credentials"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
          >
            <KeyRound size={14} aria-hidden />
            Open Vault
            <ExternalLink size={12} className="opacity-70" aria-hidden />
          </Link>
        }
      />

      {hasCredentials ? (
        <CredentialQuickFilterChips
          vaultScope="project"
          categoryChips={filter.quickCategoryChips}
          activeCategory={filter.quickCategory}
          onCategoryChange={filter.setQuickCategory}
          activeQuick={filter.quickFilters}
          onToggleQuick={filter.toggleQuickFilter}
        />
      ) : null}

      {!hasCredentials ? (
        <EmptyState
          icon={KeyRound}
          title="No credentials linked"
          description="Bind credentials to this product's access slots in Delivery or Credentials Vault."
        />
      ) : !hasVisibleCredentials ? (
        <EmptyState
          icon={KeyRound}
          title="No matching credentials"
          description="Try adjusting search or filters."
        />
      ) : viewMode === 'list' ? (
        <CredentialVaultTable
          credentials={filter.displayCredentials}
          loading={loading}
          listScope="active"
          secretFlashCredentialId={secretFlashCredentialId}
          onCopyText={handleCopyText}
          onCopySecret={handleCopySecret}
          onCreateOpen={() => router.push('/credentials')}
          onOpenCredential={handleOpenCredential}
          showCreate={false}
        />
      ) : viewMode === 'tiles' ? (
        <CredentialVaultTiles
          credentials={filter.displayCredentials}
          loading={loading}
          showCreate={false}
          onCreateOpen={() => router.push('/credentials')}
          onOpenCredential={handleOpenCredential}
          onCopyText={handleCopyText}
          onCopySecret={handleCopySecret}
          secretFlashCredentialId={secretFlashCredentialId}
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <CredentialVaultCategoryBoard
            credentials={filter.displayCredentials}
            loading={loading}
            vaultScope="project"
            showCreate={false}
            categoryColumns={filter.boardCategoryColumns}
            onCreateInCategory={() => router.push('/credentials')}
            onOpenCredential={handleOpenCredential}
            onCopyText={handleCopyText}
            onCopySecret={handleCopySecret}
            secretFlashCredentialId={secretFlashCredentialId}
          />
        </div>
      )}

      <CredentialFormSheet
        open={credentialSheet.isOpen}
        onOpenChange={credentialSheet.handleOpenChange}
        credentialId={credentialSheet.entityId}
        initialItem={sheetInitialItem}
        vaultScope="project"
        presetKey={credentialSheet.entityId ?? 'product-credentials'}
        continueAfterCreate
        onSaved={() => void refetch()}
      />
    </div>
  );
}
