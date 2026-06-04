'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ExternalLink, KeyRound } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHero,
  ViewModeSwitch,
} from '@/components/shared';
import type { CredentialSecretField } from '@/lib/api/credentials';
import { CredentialVaultTable } from '@/features/credentials/components/credential-vault-table';
import { CredentialVaultTiles } from '@/features/credentials/components/credential-vault-tiles';
import { buildCredentialVaultHref } from '@/features/credentials/constants/credential-vault-deep-link';
import { CredentialVaultSessionProvider } from '@/features/credentials/hooks/use-credential-vault-session';
import { useVaultPasswordCopy } from '@/features/credentials/hooks/use-vault-password-copy';
import { PRODUCT_CREDENTIALS_VIEW_OPTIONS } from '@/features/projects/constants/product-credentials-view-options';
import { useProductCredentialsViewMode } from '@/features/projects/constants/product-credentials-view-storage';
import type { UseProductCredentialsTabResult } from '@/features/projects/hooks/use-product-credentials-tab';
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
      router.push(buildCredentialVaultHref(id));
    },
    [router],
  );

  if (loading && credentials.length === 0) {
    return <LoadingState count={3} />;
  }

  if (error) {
    return <ErrorState description={error} onRetry={() => void refetch()} />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <PageHero
        syncModuleTitle={false}
        className="mt-0"
        viewMode={
          credentials.length > 0 ? (
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

      {credentials.length === 0 ? (
        <EmptyState
          icon={KeyRound}
          title="No credentials linked"
          description="Bind credentials to this product's access slots in Delivery or Credentials Vault."
        />
      ) : viewMode === 'list' ? (
        <CredentialVaultTable
          credentials={credentials}
          loading={loading}
          listScope="active"
          secretFlashCredentialId={secretFlashCredentialId}
          onCopyText={handleCopyText}
          onCopySecret={handleCopySecret}
          onCreateOpen={() => router.push('/credentials')}
          onOpenCredential={handleOpenCredential}
          showCreate={false}
        />
      ) : (
        <CredentialVaultTiles
          credentials={credentials}
          loading={loading}
          showCreate={false}
          onCreateOpen={() => router.push('/credentials')}
          onOpenCredential={handleOpenCredential}
          onCopyText={handleCopyText}
          onCopySecret={handleCopySecret}
          secretFlashCredentialId={secretFlashCredentialId}
        />
      )}
    </div>
  );
}
