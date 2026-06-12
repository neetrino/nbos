'use client';

import { useCallback, useState } from 'react';
import { FolderKanban, FolderOpen, KeyRound, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared';
import { CredentialVaultFoldersNav } from '@/features/credentials/components/credential-vault-folders-nav';
import { CredentialProjectShellCard } from '@/features/credentials/components/credential-project-shell-card';
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
import type {
  CredentialFolder,
  CredentialProjectShell,
  CredentialSecretField,
} from '@/lib/api/credentials';
import { PermissionGate } from '@/lib/permissions';
import {
  canMoveCredentialsToFolder,
  type CredentialFolderMatchInput,
} from '@/features/credentials/utils/credential-folder-scope';
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
  onDeleteFolder: (folderId: string) => Promise<void>;
  onRemoveFolderGrouping: (folderId: string) => Promise<void>;
  onCreateOpen: () => void;
  onOpenCredential: (id: string) => void;
  onSetFavorite?: (id: string, favorite: boolean) => void;
  onRequestMoveToTrash?: (id: string, name: string) => void;
  canMoveToTrash?: boolean;
  onCopyText: (text: string) => void;
  onCopySecret?: (credentialId: string, criticality: string, field: CredentialSecretField) => void;
  secretFlashCredentialId?: string | null;
  credentialDrag?: CredentialVaultCardDragConfig;
  credentialFolderDrop?: {
    busy?: boolean;
    draggingCredentialIds: readonly string[];
    resolveCredential: (credentialId: string) => CredentialFolderMatchInput | null | undefined;
    onMoveCredentialsToFolder: (credentialIds: string[], folderId: string) => void | Promise<void>;
  };
  projectShellsMode?: boolean;
  projectShells?: CredentialProjectShell[];
  projectShellsLoading?: boolean;
  activeProject?: { id: string; name: string } | null;
  onOpenProject?: (projectId: string) => void;
  onNavigateProject?: (projectId: string | null) => void;
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
  onDeleteFolder,
  onRemoveFolderGrouping,
  onCreateOpen,
  onOpenCredential,
  onSetFavorite,
  onRequestMoveToTrash,
  canMoveToTrash = false,
  onCopyText,
  onCopySecret,
  secretFlashCredentialId,
  credentialDrag,
  credentialFolderDrop,
  projectShellsMode = false,
  projectShells = [],
  projectShellsLoading = false,
  activeProject = null,
  onOpenProject,
  onNavigateProject,
}: CredentialVaultFoldersViewProps) {
  const [dropTargetFolderId, setDropTargetFolderId] = useState<string | null>(null);

  const buildFolderDropHandlers = useCallback(
    (folderId: string): CredentialFolderDropHandlers | undefined => {
      if (!credentialFolderDrop) return undefined;
      const { busy, draggingCredentialIds, resolveCredential, onMoveCredentialsToFolder } =
        credentialFolderDrop;
      const folder = folders.find((item) => item.id === folderId);
      if (!folder) return undefined;

      const canDropIds = (credentialIds: readonly string[]) =>
        canMoveCredentialsToFolder(credentialIds, folder, resolveCredential);

      return {
        onDragOver: (event) => {
          const dataTransfer = event.dataTransfer;
          if (busy || !dataTransfer || !dataTransferHasCredentialVaultDrag(dataTransfer)) return;
          if (draggingCredentialIds.length === 0) return;

          event.preventDefault();
          if (!canDropIds(draggingCredentialIds)) {
            dataTransfer.dropEffect = 'none';
            setDropTargetFolderId((current) => (current === folderId ? null : current));
            return;
          }
          dataTransfer.dropEffect = 'move';
          setDropTargetFolderId(folderId);
        },
        onDragLeave: (event) => {
          const currentTarget = event.currentTarget;
          const next = event.relatedTarget as Node | null;
          if (currentTarget instanceof HTMLElement && next && currentTarget.contains(next)) return;
          setDropTargetFolderId((current) => (current === folderId ? null : current));
        },
        onDrop: (event) => {
          event.preventDefault();
          setDropTargetFolderId(null);
          if (busy) return;
          const dataTransfer = event.dataTransfer;
          if (!dataTransfer) return;
          const raw = dataTransfer.getData(CREDENTIAL_VAULT_DRAG_MIME);
          const parsed = parseCredentialVaultDragPayload(raw);
          if (!parsed?.credentialIds.length) return;
          if (!canDropIds(parsed.credentialIds)) {
            toast.error('Credential and folder must be in the same section');
            return;
          }
          void onMoveCredentialsToFolder([...parsed.credentialIds], folderId);
        },
      };
    },
    [credentialFolderDrop, folders],
  );

  const isCredentialDragActive = (credentialFolderDrop?.draggingCredentialIds.length ?? 0) > 0;

  const folderDropState = useCallback(
    (folderId: string): 'idle' | 'valid' | 'invalid' => {
      if (!isCredentialDragActive || !credentialFolderDrop) return 'idle';
      const folder = folders.find((item) => item.id === folderId);
      if (!folder) return 'idle';
      return canMoveCredentialsToFolder(
        credentialFolderDrop.draggingCredentialIds,
        folder,
        credentialFolderDrop.resolveCredential,
      )
        ? 'valid'
        : 'invalid';
    },
    [credentialFolderDrop, folders, isCredentialDragActive],
  );

  const levelFolders = credentialFoldersAtLevel(folders, activeFolderId);
  const folderPath = buildCredentialFolderBreadcrumb(folders, activeFolderId);
  const atProjectRoot = projectShellsMode && !activeProject;
  const insideProject = projectShellsMode && Boolean(activeProject);
  const atVaultRoot = !activeFolderId && !projectShellsMode;
  const credentialsSectionLabel = atVaultRoot ? 'Unfiled' : 'Credentials';
  const hasProjectShells = projectShells.length > 0;
  const hasFolders = levelFolders.length > 0;
  const hasCredentials = credentials.length > 0;
  const isEmpty =
    !foldersLoading &&
    !credentialsLoading &&
    !projectShellsLoading &&
    !hasFolders &&
    !hasCredentials &&
    !(atProjectRoot && hasProjectShells);

  const nav = (
    <CredentialVaultFoldersNav
      rootLabel={projectShellsMode ? 'Projects' : 'Folders'}
      project={insideProject ? activeProject : null}
      folderPath={folderPath}
      onNavigateRoot={() => {
        if (projectShellsMode) onNavigateProject?.(null);
        else onNavigateFolder(null);
      }}
      onNavigateProject={onNavigateProject}
      onNavigateFolder={onOpenFolder}
    />
  );

  if (atProjectRoot && !projectShellsLoading && !hasProjectShells) {
    return (
      <div className="space-y-3">
        <EmptyState
          icon={FolderKanban}
          title="No project credentials"
          description="Project credentials appear here once they are linked to a project"
        />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="space-y-3">
        {nav}
        <EmptyState
          icon={activeFolderId ? FolderOpen : KeyRound}
          title={
            activeFolderId
              ? 'Folder is empty'
              : atVaultRoot
                ? 'No folders or unfiled credentials'
                : 'No folders or credentials'
          }
          description={
            activeFolderId
              ? 'Create a subfolder or add a credential to this folder'
              : insideProject
                ? 'Add a subfolder or credential to this project'
                : 'Create a folder or add credentials without a folder'
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
      {!atProjectRoot ? nav : null}

      {atProjectRoot && (projectShellsLoading || hasProjectShells) ? (
        <div className="space-y-2">
          <VaultFoldersSectionLabel label="Projects" />
          <div className={CREDENTIAL_VAULT_TILE_GRID_CLASS}>
            {projectShellsLoading
              ? Array.from({ length: GRID_SKELETON_COUNT }).map((_, index) => (
                  <Skeleton key={`project-skel-${index}`} className={GRID_CARD_SKELETON_CLASS} />
                ))
              : projectShells.map((shell) => (
                  <CredentialProjectShellCard
                    key={shell.id}
                    shell={shell}
                    onOpen={(projectId) => onOpenProject?.(projectId)}
                  />
                ))}
          </div>
        </div>
      ) : null}

      {!atProjectRoot && (foldersLoading || hasFolders) ? (
        <div className="space-y-2">
          <VaultFoldersSectionLabel label="Folders" />
          <div className={CREDENTIAL_VAULT_TILE_GRID_CLASS}>
            {foldersLoading
              ? Array.from({ length: GRID_SKELETON_COUNT }).map((_, index) => (
                  <Skeleton key={`folder-skel-${index}`} className={GRID_CARD_SKELETON_CLASS} />
                ))
              : levelFolders.map((folder) => {
                  const dropState = folderDropState(folder.id);
                  return (
                    <CredentialFolderCard
                      key={folder.id}
                      folder={folder}
                      childFolderCount={credentialFolderChildCount(folders, folder.id)}
                      canManage={showCreate}
                      onOpen={onOpenFolder}
                      onRename={onRenameFolder}
                      onDelete={onDeleteFolder}
                      onRemoveGrouping={onRemoveFolderGrouping}
                      dropState={dropState}
                      dropHighlight={dropState === 'valid' && dropTargetFolderId === folder.id}
                      dropHandlers={
                        dropState === 'invalid' ? undefined : buildFolderDropHandlers(folder.id)
                      }
                    />
                  );
                })}
          </div>
        </div>
      ) : null}

      {!atProjectRoot && (credentialsLoading || hasCredentials) ? (
        <div className="space-y-2">
          <VaultFoldersSectionLabel label={credentialsSectionLabel} />
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
                    onRequestMoveToTrash={onRequestMoveToTrash}
                    canMoveToTrash={canMoveToTrash}
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
