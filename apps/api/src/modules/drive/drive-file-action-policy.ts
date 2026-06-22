import type { FileGrantPermission } from './drive-grant-permissions';

/** Lifecycle / placement actions per Drive canon §5–§7 and cleanup register. */
export const DRIVE_FILE_ACTIONS = [
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

export type DriveFileAction = (typeof DRIVE_FILE_ACTIONS)[number];

const SELF_ONLY_VISIBILITIES = new Set<string>(['PERSONAL', 'RESTRICTED']);
const SENSITIVE_CONFIDENTIALITIES = new Set<string>([
  'FINANCE_SENSITIVE',
  'LEGAL_SENSITIVE',
  'SECRET_ADJACENT',
]);

const EDIT_LIKE_GRANTS: FileGrantPermission[] = ['EDIT_METADATA', 'SHARE', 'UPLOAD_VERSION'];

export interface DriveFileActionFileSnapshot {
  visibility: string;
  confidentiality: string;
  status?: string | null;
  activeBusinessLinkCount: number;
  targetFolderSpace?: 'COMPANY' | 'PERSONAL';
}

export interface DriveFileActorCapabilities {
  employeeId: string;
  isOrigin: boolean;
  /** Visible via scope/inherited/department — not grant-only. */
  hasBaseAccess: boolean;
  grantPermissions: ReadonlySet<FileGrantPermission>;
}

export interface DriveFileActionDecision {
  allowed: boolean;
  reason?: string;
}

function hasAnyGrant(
  cap: DriveFileActorCapabilities,
  permissions: readonly FileGrantPermission[],
): boolean {
  return permissions.some((permission) => cap.grantPermissions.has(permission));
}

function isGrantOnlyViewer(cap: DriveFileActorCapabilities): boolean {
  return !cap.isOrigin && !cap.hasBaseAccess && cap.grantPermissions.size > 0;
}

function evaluateCopyConstraints(file: DriveFileActionFileSnapshot): DriveFileActionDecision {
  if (
    SELF_ONLY_VISIBILITIES.has(file.visibility) ||
    SENSITIVE_CONFIDENTIALITIES.has(file.confidentiality)
  ) {
    return {
      allowed: false,
      reason: 'Restricted or sensitive Drive files cannot be copied as independent files.',
    };
  }
  if (file.targetFolderSpace === 'PERSONAL' && file.activeBusinessLinkCount > 0) {
    return {
      allowed: false,
      reason: 'Business-linked Drive files cannot be copied into Personal Drive.',
    };
  }
  return { allowed: true };
}

function denyNonOriginRestrictedVisibility(
  cap: DriveFileActorCapabilities,
  visibility: string,
): DriveFileActionDecision | null {
  if (!cap.isOrigin && SELF_ONLY_VISIBILITIES.has(visibility)) {
    return {
      allowed: false,
      reason: 'Only the file owner can change personal or restricted files.',
    };
  }
  return null;
}

/** Pure policy matrix for Share / Move / Copy / Delete (NBOS Drive §3, §5, overview §7). */
export function evaluateDriveFileAction(
  cap: DriveFileActorCapabilities,
  action: DriveFileAction,
  file: DriveFileActionFileSnapshot,
): DriveFileActionDecision {
  const restricted = denyNonOriginRestrictedVisibility(cap, file.visibility);
  if (restricted) return restricted;

  if (action === 'COPY') {
    const copyRules = evaluateCopyConstraints(file);
    if (!copyRules.allowed) return copyRules;
    if (cap.isOrigin) return { allowed: true };
    if (isGrantOnlyViewer(cap)) {
      return { allowed: false, reason: 'View-only grant does not allow copying this file.' };
    }
    if (hasAnyGrant(cap, EDIT_LIKE_GRANTS)) return { allowed: true };
    if (cap.hasBaseAccess) return { allowed: true };
    return { allowed: false, reason: 'You do not have permission to copy this file.' };
  }

  switch (action) {
    case 'SHARE':
    case 'LINK':
      if (cap.isOrigin) return { allowed: true };
      if (hasAnyGrant(cap, ['SHARE'])) return { allowed: true };
      if (cap.hasBaseAccess && file.visibility !== 'RESTRICTED') return { allowed: true };
      return { allowed: false, reason: 'You do not have permission to share this file.' };

    case 'MOVE_PLACEMENT':
    case 'ADD_PLACEMENT':
    case 'REMOVE_PLACEMENT':
    case 'EDIT_METADATA':
      if (cap.isOrigin) return { allowed: true };
      if (hasAnyGrant(cap, EDIT_LIKE_GRANTS)) return { allowed: true };
      if (cap.hasBaseAccess) return { allowed: true };
      if (isGrantOnlyViewer(cap)) {
        return {
          allowed: false,
          reason: 'View-only grant does not allow changing folder placement or metadata.',
        };
      }
      return { allowed: false, reason: 'You do not have permission to modify this file.' };

    case 'UPLOAD_VERSION':
      if (cap.isOrigin) return { allowed: true };
      if (hasAnyGrant(cap, ['UPLOAD_VERSION'])) return { allowed: true };
      if (cap.hasBaseAccess) return { allowed: true };
      return { allowed: false, reason: 'You do not have permission to upload a new version.' };

    case 'EXPORT':
      if (cap.isOrigin) return { allowed: true };
      if (hasAnyGrant(cap, ['EXPORT'])) return { allowed: true };
      if (cap.hasBaseAccess) return { allowed: true };
      if (hasAnyGrant(cap, ['VIEW']) && isGrantOnlyViewer(cap)) {
        return { allowed: true };
      }
      return { allowed: false, reason: 'You do not have permission to export this file.' };

    case 'UNLINK':
      if (cap.isOrigin) return { allowed: true };
      if (hasAnyGrant(cap, ['DELETE'])) return { allowed: true };
      if (cap.hasBaseAccess) return { allowed: true };
      return { allowed: false, reason: 'You do not have permission to unlink this file.' };

    case 'ARCHIVE':
      if (cap.isOrigin) return { allowed: true };
      if (hasAnyGrant(cap, ['DELETE'])) return { allowed: true };
      if (cap.hasBaseAccess) return { allowed: true };
      return {
        allowed: false,
        reason: 'You do not have permission to archive or delete this file.',
      };

    case 'TRASH':
      if (file.status === 'DELETED') {
        return { allowed: false, reason: 'File is already in Trash.' };
      }
      if (file.activeBusinessLinkCount > 0) {
        return {
          allowed: false,
          reason: 'Remove active business links before moving to Trash.',
        };
      }
      if (cap.isOrigin) return { allowed: true };
      if (hasAnyGrant(cap, ['DELETE'])) return { allowed: true };
      if (cap.hasBaseAccess) return { allowed: true };
      return {
        allowed: false,
        reason: 'You do not have permission to move this file to Trash.',
      };

    case 'RESTORE':
      if (file.status !== 'DELETED') {
        return { allowed: false, reason: 'Only Trash files can be restored.' };
      }
      if (cap.isOrigin) return { allowed: true };
      if (hasAnyGrant(cap, ['DELETE'])) return { allowed: true };
      if (cap.hasBaseAccess) return { allowed: true };
      return {
        allowed: false,
        reason: 'You do not have permission to restore this file.',
      };

    case 'PERMANENT_DELETE':
      if (file.status !== 'DELETED') {
        return { allowed: false, reason: 'Only Trash files can be permanently purged.' };
      }
      if (file.activeBusinessLinkCount > 0) {
        return {
          allowed: false,
          reason: 'Remove active business links before permanent delete.',
        };
      }
      if (cap.isOrigin) return { allowed: true };
      if (hasAnyGrant(cap, ['DELETE'])) return { allowed: true };
      return {
        allowed: false,
        reason: 'You do not have permission to permanently delete this file.',
      };

    default:
      return { allowed: false, reason: 'Unsupported Drive file action.' };
  }
}

export function listAllowedDriveFileActions(
  cap: DriveFileActorCapabilities,
  file: DriveFileActionFileSnapshot,
): DriveFileAction[] {
  return DRIVE_FILE_ACTIONS.filter((action) => evaluateDriveFileAction(cap, action, file).allowed);
}
