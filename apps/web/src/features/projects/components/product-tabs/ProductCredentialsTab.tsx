'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, KeyRound, Plus } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
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
import { useProductCredentialsCreate } from '@/features/projects/hooks/use-product-credentials-create';
import { useProductCredentialsFilter } from '@/features/projects/hooks/use-product-credentials-filter';
import type { UseProductCredentialsTabResult } from '@/features/projects/hooks/use-product-credentials-tab';
import { useProductEntityDetailSheet } from '@/features/projects/hooks/use-product-entity-detail-sheet';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import type { CredentialSecretField } from '@/lib/api/credentials';
import { PermissionGate } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type ProductCredentialsTabProps = UseProductCredentialsTabResult & {
  productId: string;
  projectId: string;
  productName: string;
};

export function ProductCredentialsTab({
  credentials,
  loading,
  error,
  refetch,
  productId,
  projectId,
  productName,
}: ProductCredentialsTabProps) {
  return (
    <CredentialVaultSessionProvider>
      <ProductCredentialsTabContent
        credentials={credentials}
        loading={loading}
        error={error}
        refetch={refetch}
        productId={productId}
        projectId={projectId}
        productName={productName}
      />
    </CredentialVaultSessionProvider>
  );
}

function ProductCredentialsTabContent({
  credentials,
  loading,
  error,
  refetch,
  productId,
  projectId,
  productName,
}: ProductCredentialsTabProps) {
  const [viewMode, setViewMode] = useProductCredentialsViewMode();
  const [secretFlashCredentialId, setSecretFlashCredentialId] = useState<string | null>(null);
  const [sheetInitialItem, setSheetInitialItem] = useState<CredentialListItem | null>(null);
  const credentialSheet = useProductEntityDetailSheet();
  const create = useProductCredentialsCreate({ productId, productName, refetch });
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

  const handleOpenCreate = useCallback(() => {
    setSheetInitialItem(null);
    credentialSheet.handleOpenChange(false);
    create.openCreate();
  }, [create, credentialSheet]);

  const handleOpenCreateInCategory = useCallback(
    (category: string) => {
      setSheetInitialItem(null);
      credentialSheet.handleOpenChange(false);
      create.openCreateInCategory(category);
    },
    [create, credentialSheet],
  );

  const handleOpenCredential = useCallback(
    (id: string) => {
      create.closeCreate();
      const item =
        credentials.find((row) => row.id === id) ??
        filter.displayCredentials.find((row) => row.id === id) ??
        null;
      setSheetInitialItem(item);
      credentialSheet.openEntity(id);
    },
    [create, credentialSheet, credentials, filter.displayCredentials],
  );

  const handleSheetOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        create.closeCreate();
        credentialSheet.handleOpenChange(false);
        setSheetInitialItem(null);
      }
    },
    [create, credentialSheet],
  );

  const newCredentialButton = (
    <PermissionGate module="CREDENTIALS" action="ADD">
      <Button type="button" size="sm" onClick={handleOpenCreate}>
        <Plus size={14} aria-hidden />
        New Credential
      </Button>
    </PermissionGate>
  );

  if (loading && credentials.length === 0) {
    return <LoadingState count={3} />;
  }

  if (error) {
    return <ErrorState description={error} onRetry={() => void refetch()} />;
  }

  const hasCredentials = credentials.length > 0;
  const hasVisibleCredentials = filter.displayCredentials.length > 0;
  const isCreating = create.createOpen;
  const sheetOpen = isCreating || credentialSheet.isOpen;

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
          <div className="flex flex-wrap items-center gap-2">
            {newCredentialButton}
            <Link
              href="/credentials"
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
            >
              <KeyRound size={14} aria-hidden />
              Open Vault
              <ExternalLink size={12} className="opacity-70" aria-hidden />
            </Link>
          </div>
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
          action={newCredentialButton}
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
          onCreateOpen={handleOpenCreate}
          onOpenCredential={handleOpenCredential}
          showCreate
        />
      ) : viewMode === 'tiles' ? (
        <CredentialVaultTiles
          credentials={filter.displayCredentials}
          loading={loading}
          showCreate
          onCreateOpen={handleOpenCreate}
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
            showCreate
            categoryColumns={filter.boardCategoryColumns}
            onCreateInCategory={handleOpenCreateInCategory}
            onOpenCredential={handleOpenCredential}
            onCopyText={handleCopyText}
            onCopySecret={handleCopySecret}
            secretFlashCredentialId={secretFlashCredentialId}
          />
        </div>
      )}

      <CredentialFormSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        credentialId={isCreating ? null : credentialSheet.entityId}
        initialItem={isCreating ? null : sheetInitialItem}
        vaultScope="project"
        projectId={projectId}
        productId={productId}
        title={isCreating ? 'New credential' : undefined}
        initialName={isCreating ? create.credentialName : undefined}
        initialCategory={isCreating ? create.initialCategory : undefined}
        successToast={isCreating ? false : undefined}
        presetKey={
          isCreating
            ? 'product-credentials-create'
            : (credentialSheet.entityId ?? 'product-credentials')
        }
        continueAfterCreate={!isCreating}
        onCreated={isCreating ? create.handleCreated : undefined}
        onSaved={() => void refetch()}
      />
    </div>
  );
}
