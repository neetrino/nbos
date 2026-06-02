'use client';

import { KeyRound, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared';
import { CredentialVaultCard } from '@/features/credentials/components/CredentialVaultCard';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import { PermissionGate } from '@/lib/permissions';

const TILE_SKELETON_COUNT = 12;

/** 4 columns on small viewports; 5–6 on large (vault tiles canon). */
export const CREDENTIAL_VAULT_TILE_GRID_CLASS =
  'grid grid-cols-4 gap-2 lg:grid-cols-5 2xl:grid-cols-6';

/** @deprecated Use {@link CREDENTIAL_VAULT_COPY_FEEDBACK_MS} from credential-vault-copy. */
export { CREDENTIAL_VAULT_COPY_FEEDBACK_MS as CREDENTIAL_VAULT_TILE_COPY_FEEDBACK_MS } from '@/features/credentials/constants/credential-vault-copy';

export interface CredentialVaultTilesProps {
  credentials: CredentialListItem[];
  loading: boolean;
  showCreate: boolean;
  onCreateOpen: () => void;
  onOpenCredential: (id: string) => void;
  onCopyLogin: (login: string) => void;
  onCopyPassword?: (credentialId: string) => void;
  passwordFlashCredentialId?: string | null;
}

export function CredentialVaultTiles({
  credentials,
  loading,
  showCreate,
  onCreateOpen,
  onOpenCredential,
  onCopyLogin,
  onCopyPassword,
  passwordFlashCredentialId,
}: CredentialVaultTilesProps) {
  if (loading) {
    return (
      <div className={CREDENTIAL_VAULT_TILE_GRID_CLASS}>
        {Array.from({ length: TILE_SKELETON_COUNT }).map((_, index) => (
          <Skeleton key={index} className="h-[92px] w-full rounded-lg" />
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
    <div className={CREDENTIAL_VAULT_TILE_GRID_CLASS}>
      {credentials.map((credential) => (
        <CredentialVaultCard
          key={credential.id}
          credential={credential}
          variant="grid"
          onOpen={onOpenCredential}
          onCopyLogin={onCopyLogin}
          onCopyPassword={onCopyPassword}
          passwordFlashCredentialId={passwordFlashCredentialId}
        />
      ))}
    </div>
  );
}
