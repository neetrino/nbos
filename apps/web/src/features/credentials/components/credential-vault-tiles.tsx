'use client';

import { Copy, ExternalLink, KeyRound, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared';
import type { VaultListScope } from '@/features/credentials/components/credential-vault-table';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import { PermissionGate } from '@/lib/permissions';

const TILE_SKELETON_COUNT = 6;

export interface CredentialVaultTilesProps {
  credentials: CredentialListItem[];
  loading: boolean;
  listScope: VaultListScope;
  showCreate: boolean;
  onCreateOpen: () => void;
  onOpenCredential: (id: string) => void;
  onCopyLogin: (credentialId: string, login: string) => void;
  onOpenUrl: (credentialId: string) => void;
  onCopyPassword?: (credentialId: string) => void;
}

function formatCredentialTypeLabel(credentialType: string): string {
  return credentialType.replaceAll('_', ' ');
}

function CredentialVaultTile({
  credential,
  listScope,
  onOpenCredential,
  onCopyLogin,
  onOpenUrl,
  onCopyPassword,
}: {
  credential: CredentialListItem;
  listScope: VaultListScope;
  onOpenCredential: (id: string) => void;
  onCopyLogin: (credentialId: string, login: string) => void;
  onOpenUrl: (credentialId: string) => void;
  onCopyPassword?: (credentialId: string) => void;
}) {
  const canOpenUrl = Boolean(credential.url) && listScope === 'active';
  const showCopyPassword = Boolean(onCopyPassword) && Boolean(credential.secretsPresent?.password);

  return (
    <div
      role="button"
      tabIndex={0}
      className="border-border bg-card group flex cursor-pointer flex-col gap-3 rounded-xl border p-4 transition-shadow hover:shadow-md"
      onClick={() => onOpenCredential(credential.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenCredential(credential.id);
        }
      }}
    >
      <div className="flex items-start gap-2">
        <KeyRound size={14} className="text-muted-foreground mt-0.5 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <h3 className="text-foreground truncate text-sm font-semibold">{credential.name}</h3>
          <p className="text-muted-foreground truncate text-xs">
            {credential.provider ?? 'No provider'}
          </p>
          <p className="text-muted-foreground mt-0.5 text-[11px]">
            {formatCredentialTypeLabel(credential.credentialType)}
          </p>
        </div>
      </div>

      {credential.login ? (
        <div
          className="bg-muted/40 flex items-center justify-between gap-2 rounded-lg px-2.5 py-2"
          onClick={(event) => event.stopPropagation()}
        >
          <span className="text-muted-foreground truncate font-mono text-xs">
            {credential.login}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title="Copy login"
            onClick={() => onCopyLogin(credential.id, credential.login!)}
          >
            <Copy size={12} aria-hidden />
          </Button>
        </div>
      ) : (
        <p className="text-muted-foreground text-xs">No login</p>
      )}

      <div className="flex flex-wrap gap-1.5" onClick={(event) => event.stopPropagation()}>
        {credential.login ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1 text-xs"
            onClick={() => onCopyLogin(credential.id, credential.login!)}
          >
            <Copy size={12} aria-hidden />
            Copy login
          </Button>
        ) : null}
        {showCopyPassword ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1 text-xs"
            onClick={() => onCopyPassword!(credential.id)}
          >
            <Copy size={12} aria-hidden />
            Copy password
          </Button>
        ) : null}
        {canOpenUrl ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1 text-xs"
            onClick={() => onOpenUrl(credential.id)}
          >
            <ExternalLink size={12} aria-hidden />
            Open URL
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function CredentialVaultTiles({
  credentials,
  loading,
  listScope,
  showCreate,
  onCreateOpen,
  onOpenCredential,
  onCopyLogin,
  onOpenUrl,
  onCopyPassword,
}: CredentialVaultTilesProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: TILE_SKELETON_COUNT }).map((_, index) => (
          <Skeleton key={index} className="h-44 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (credentials.length === 0) {
    return (
      <EmptyState
        icon={KeyRound}
        title="No credentials"
        description="No credentials match the current filters"
        action={
          showCreate ? (
            <PermissionGate module="CREDENTIALS" action="ADD">
              <Button onClick={onCreateOpen}>
                <Plus size={16} /> Add Credential
              </Button>
            </PermissionGate>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {credentials.map((credential) => (
        <CredentialVaultTile
          key={credential.id}
          credential={credential}
          listScope={listScope}
          onOpenCredential={onOpenCredential}
          onCopyLogin={onCopyLogin}
          onOpenUrl={onOpenUrl}
          onCopyPassword={onCopyPassword}
        />
      ))}
    </div>
  );
}
