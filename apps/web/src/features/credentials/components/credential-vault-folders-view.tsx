'use client';

import { useCallback, useState } from 'react';
import { FolderOpen, KeyRound, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared';
import { CredentialFolderBreadcrumb } from '@/features/credentials/components/credential-folder-breadcrumb';
import { CredentialFolderCard } from '@/features/credentials/components/credential-folder-card';
import { CredentialVaultCard } from '@/features/credentials/components/CredentialVaultCard';
import { CREDENTIAL_VAULT_TILE_GRID_CLASS } from '@/features/credentials/constants/credential-vault-tile-grid';
import type { CredentialVaultTilesSelectionProps } from '@/features/credentials/components/credential-vault-tiles';
import {
  buildCredentialFolderBreadcrumb,
  credentialFolderChildCount,
  credentialFoldersAtLevel,
} from '@/features/credentials/utils/credential-folder-tree';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import type { CredentialFolder, CredentialSecretField } from '@/lib/api/credentials';
import { PermissionGate } from '@/lib/permissions';
import {
  CREDENTIAL_VAULT_DRAG_MIME,
  dataTransferHasCredentialVaultDrag,
  parseCredentialVaultDragPayload,
  type CredentialFolderDropHandlers,
  type CredentialVaultCardDragConfig,
} from '@/features/credentials/utils/credential-vault-drag';

const GRID_SKELETON_COUNT = 8;
const GRID_CARD_SKELETON_CLASS = 'h-[104px] w-full rounded-lg';

function VaultFoldersSectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground shrink-0 text-xs font-medium tracking-wide">
        {label}
      </span>
      <div className="bg-border/70 h-px flex-1" />
    </div>
  );
}

export interface CredentialVaultFoldersViewProps {
  folders: CredentialFolder[];
  foldersLoading: boolean;
  activeFolderId: string | null;
  credentials: CredentialListItem[];
  credentialsLoading: boolean;
  showCreate: boolean;
  selection?: CredentialVaultTilesSelectionProps;
  onNavigateFolder: (folderId: string | null) => void;
  onOpenFolder: (folderId: string) => void;
  onRenameFolder: (folderId: string, name: string) => Promise<void>;
  onArchiveFolder: (folderId: string) => Promise<void>;
  onCreateOpen: () => void;
  onOpenCredential: (id: string) => void;
  onSetFavorite?: (id: string, favorite: boolean) => void;
  onRequestArchive?: (id: string, name: string) => void;
  canArchive?: boolean;
  onCopyText: (text: string) => void;
  onCopySecret?: (credentialId: string, criticality: string, field: CredentialSecretField) => void;
  secretFlashCredentialId?: string | null;
  credentialDrag?: CredentialVaultCardDragConfig;
  credentialFolderDrop?: {
    busy?: boolean;
    onMoveCredentialsToFolder: (credentialIds: string[], folderId: string) => void | Promise<void>;
  };
}

export function CredentialVaultFoldersView({
  folders,
  foldersLoading,
  activeFolderId,
  credentials,
  credentialsLoading,
  showCreate,
  selection,
  onNavigateFolder,
  onOpenFolder,
  onRenameFolder,
  onArchiveFolder,
  onCreateOpen,
  onOpenCredential,
  onSetFavorite,
  onRequestArchive,
  canArchive = false,
  onCopyText,
  onCopySecret,
  secretFlashCredentialId,
  credentialDrag,
  credentialFolderDrop,
}: CredentialVaultFoldersViewProps) {
  const [dropTargetFolderId, setDropTargetFolderId] = useState<string | null>(null);

  const buildFolderDropHandlers = useCallback(
    (folderId: string): CredentialFolderDropHandlers | undefined => {
      if (!credentialFolderDrop) return undefined;
      const { busy, onMoveCredentialsToFolder } = credentialFolderDrop;

      return {
        onDragOver: (event) => {
          if (busy || !dataTransferHasCredentialVaultDrag(event.dataTransfer)) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = 'move';
          setDropTargetFolderId(folderId);
        },
        onDragLeave: (event) => {
          const next = event.relatedTarget as Node | null;
          if (next && event.currentTarget.contains(next)) return;
          setDropTargetFolderId((current) => (current === folderId ? null : current));
        },
        onDrop: (event) => {
          event.preventDefault();
          setDropTargetFolderId(null);
          if (busy) return;
          const raw = event.dataTransfer.getData(CREDENTIAL_VAULT_DRAG_MIME);
          const parsed = parseCredentialVaultDragPayload(raw);
          if (!parsed?.credentialIds.length) return;
          void onMoveCredentialsToFolder([...parsed.credentialIds], folderId);
        },
      };
    },
    [credentialFolderDrop],
  );

  const levelFolders = credentialFoldersAtLevel(folders, activeFolderId);
  const breadcrumb = buildCredentialFolderBreadcrumb(folders, activeFolderId);
  const hasFolders = levelFolders.length > 0;
  const hasCredentials = credentials.length > 0;
  const isEmpty = !foldersLoading && !credentialsLoading && !hasFolders && !hasCredentials;

  if (isEmpty) {
    return (
      <div className="space-y-3">
        <CredentialFolderBreadcrumb path={breadcrumb} onNavigate={onNavigateFolder} />
        <EmptyState
          icon={activeFolderId ? FolderOpen : KeyRound}
          title={activeFolderId ? 'Folder is empty' : 'No folders or credentials'}
          description={
            activeFolderId
              ? 'Create a subfolder or add a credential to this folder'
              : 'Create a folder or add a credential without a folder'
          }
          action={
            showCreate ? (
              <PermissionGate module="CREDENTIALS" action="ADD">
                <Button onClick={onCreateOpen}>
                  <Plus size={16} aria-hidden />
                  Add Credential
                </Button>
              </PermissionGate>
            ) : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CredentialFolderBreadcrumb path={breadcrumb} onNavigate={onNavigateFolder} />

      {foldersLoading || hasFolders ? (
        <div className="space-y-2">
          <VaultFoldersSectionLabel label="Folders" />
          <div className={CREDENTIAL_VAULT_TILE_GRID_CLASS}>
            {foldersLoading
              ? Array.from({ length: GRID_SKELETON_COUNT }).map((_, index) => (
                  <Skeleton key={`folder-skel-${index}`} className={GRID_CARD_SKELETON_CLASS} />
                ))
              : levelFolders.map((folder) => (
                  <CredentialFolderCard
                    key={folder.id}
                    folder={folder}
                    childFolderCount={credentialFolderChildCount(folders, folder.id)}
                    canManage={showCreate}
                    onOpen={onOpenFolder}
                    onRename={onRenameFolder}
                    onArchive={onArchiveFolder}
                    dropHighlight={dropTargetFolderId === folder.id}
                    dropHandlers={buildFolderDropHandlers(folder.id)}
                  />
                ))}
          </div>
        </div>
      ) : null}

      {credentialsLoading || hasCredentials ? (
        <div className="space-y-2">
          <VaultFoldersSectionLabel label="Credentials" />
          <div className={CREDENTIAL_VAULT_TILE_GRID_CLASS}>
            {credentialsLoading
              ? Array.from({ length: GRID_SKELETON_COUNT }).map((_, index) => (
                  <Skeleton key={`cred-skel-${index}`} className={GRID_CARD_SKELETON_CLASS} />
                ))
              : credentials.map((credential) => (
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
                    credentialDrag={credentialDrag}
                  />
                ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
