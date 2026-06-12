import type { FileAsset } from '@/lib/api/drive';
import type { DriveActionCapabilities } from './drive-action-capabilities';
import { isDriveFileInTrash } from './drive-lifecycle';

/** Mirrors API `DRIVE_FILE_ACTIONS` in `drive-file-action-policy.ts`. */
export const DRIVE_FILE_ACTION_KEYS = [
  'SHARE',
  'LINK',
  'UNLINK',
  'EDIT_METADATA',
  'UPLOAD_VERSION',
  'EXPORT',
  'MOVE_PLACEMENT',
  'ADD_PLACEMENT',
  'REMOVE_PLACEMENT',
  'COPY',
  'ARCHIVE',
  'TRASH',
  'RESTORE',
  'PERMANENT_DELETE',
] as const;

export type DriveFileActionKey = (typeof DRIVE_FILE_ACTION_KEYS)[number];

export type DriveFileActionGates = {
  canShare: boolean;
  canCopy: boolean;
  canMove: boolean;
  canRemovePlacement: boolean;
  canUnlink: boolean;
  canUploadVersion: boolean;
  canRestore: boolean;
  canMoveToTrash: boolean;
};

function serverAllows(
  serverActions: readonly string[] | null,
  action: DriveFileActionKey,
): boolean {
  if (serverActions === null) return true;
  return serverActions.includes(action);
}

/** Layout (view mode) ∩ server policy for list/detail/menus. */
export function applyServerFileActionGates(
  caps: DriveActionCapabilities,
  serverActions: readonly string[] | null,
): DriveActionCapabilities {
  if (serverActions === null) return caps;
  return {
    ...caps,
    canShareFile: caps.canShareFile && serverAllows(serverActions, 'SHARE'),
    canMovePlacementInTree:
      caps.canMovePlacementInTree && serverAllows(serverActions, 'MOVE_PLACEMENT'),
    canCopyIntoFolderTree: caps.canCopyIntoFolderTree && serverAllows(serverActions, 'COPY'),
    canRemoveFromFolder:
      caps.canRemoveFromFolder && serverAllows(serverActions, 'REMOVE_PLACEMENT'),
    canUnlinkFromRecord: caps.canUnlinkFromRecord && serverAllows(serverActions, 'UNLINK'),
  };
}

/** Per-file gates for detail rail and context menus (incl. lifecycle). */
export function buildDriveFileActionGates(
  caps: DriveActionCapabilities,
  file: FileAsset | null,
  serverActions: readonly string[] | null,
): DriveFileActionGates {
  if (!file) {
    return {
      canShare: false,
      canCopy: false,
      canMove: false,
      canRemovePlacement: false,
      canUnlink: false,
      canUploadVersion: false,
      canRestore: false,
      canMoveToTrash: false,
    };
  }
  const inTrash = isDriveFileInTrash(file);
  const deleteFamily =
    serverAllows(serverActions, 'ARCHIVE') ||
    serverAllows(serverActions, 'TRASH') ||
    serverAllows(serverActions, 'PERMANENT_DELETE');
  const canTrash = serverAllows(serverActions, 'TRASH');

  return {
    canShare: caps.canShareFile && serverAllows(serverActions, 'SHARE'),
    canCopy: caps.canCopyIntoFolderTree && serverAllows(serverActions, 'COPY'),
    canMove: caps.canMovePlacementInTree && serverAllows(serverActions, 'MOVE_PLACEMENT'),
    canRemovePlacement: caps.canRemoveFromFolder && serverAllows(serverActions, 'REMOVE_PLACEMENT'),
    canUnlink: caps.canUnlinkFromRecord && serverAllows(serverActions, 'UNLINK'),
    canUploadVersion:
      !inTrash && serverAllows(serverActions, 'UPLOAD_VERSION') && file.storageProvider === 'R2',
    canRestore: inTrash && deleteFamily,
    canMoveToTrash: !inTrash && canTrash,
  };
}
