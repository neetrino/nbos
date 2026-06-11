'use client';

import { KeyRound, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared';
import { CredentialVaultCard } from '@/features/credentials/components/CredentialVaultCard';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import { PermissionGate } from '@/lib/permissions';

const TILE_SKELETON_COUNT = 12;

import { CREDENTIAL_VAULT_TILE_GRID_CLASS } from '@/features/credentials/constants/credential-vault-tile-grid';

export { CREDENTIAL_VAULT_TILE_GRID_CLASS };

export interface CredentialVaultTilesSelectionProps {
  enabled: boolean;
  selectionActive: boolean;
  isSelected: (id: string) => boolean;
  onToggle: (id: string) => void;
}

import type { CredentialSecretField } from '@/lib/api/credentials';

export interface CredentialVaultTilesProps {
  credentials: CredentialListItem[];
  loading: boolean;
  showCreate: boolean;
  selection?: CredentialVaultTilesSelectionProps;
  onCreateOpen: () => void;
  onOpenCredential: (id: string) => void;
  onSetFavorite?: (id: string, favorite: boolean) => void;
  onRequestArchive?: (id: string, name: string) => void;
  canArchive?: boolean;
  onCopyText: (text: string) => void;
  onCopySecret?: (credentialId: string, criticality: string, field: CredentialSecretField) => void;
  secretFlashCredentialId?: string | null;
}

export function CredentialVaultTiles({
  credentials,
  loading,
  showCreate,
  selection,
  onCreateOpen,
  onOpenCredential,
  onSetFavorite,
  onRequestArchive,
  canArchive = false,
  onCopyText,
  onCopySecret,
  secretFlashCredentialId,
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
          onSetFavorite={onSetFavorite}
          onRequestArchive={onRequestArchive}
          canArchive={canArchive}
          onCopyText={onCopyText}
          onCopySecret={onCopySecret}
          secretFlashCredentialId={secretFlashCredentialId}
          selectionEnabled={selection?.enabled}
          selectionActive={selection?.selectionActive ?? false}
          selected={selection?.isSelected(credential.id)}
          onToggleSelected={() => selection?.onToggle(credential.id)}
        />
      ))}
    </div>
  );
}
