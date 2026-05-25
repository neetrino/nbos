import type { DriveEntityFolderScope } from './drive-entity-folder-scope';
import {
  resolveProjectHubFileListParams,
  type DriveProjectHubView,
} from './drive-project-hub-view';

export type DriveLibraryRecordLink = {
  entityType: string;
  entityId: string;
};

export type DriveActionCapabilities = {
  /** Folder rows: checkboxes, rename/delete, drag-drop targets. */
  showFolderBulkSelection: boolean;
  showFolderRowActions: boolean;
  showFolderFileDragDrop: boolean;
  /** `DriveFolderItem`: remove placement from current folder. */
  canRemoveFromFolder: boolean;
  canMovePlacementInTree: boolean;
  canCopyIntoFolderTree: boolean;
  /** Open detail panel → access grants (Share). */
  canShareFile: boolean;
  /** `FileLink` context for the open library record (incl. project hub virtual focus). */
  libraryRecordLink: DriveLibraryRecordLink | null;
  canUnlinkFromRecord: boolean;
  canPlaceInCompanyFolder: boolean;
  /** Project hub Deals/Products/… — no folder placements UI. */
  isVirtualFileBrowse: boolean;
};

export function resolveDriveActionCapabilities(input: {
  browseFolderPlacements: boolean;
  projectHubFileBrowse: boolean;
  browseSystemLibraryUploads: boolean;
  systemLibraryLink: DriveLibraryRecordLink | null;
  libraryEntityFolderScope: DriveEntityFolderScope | null;
  projectHubView: DriveProjectHubView;
  selectedSpaceKey: string;
  placementFolderId: string | null;
  driveStorageSpace: 'COMPANY' | 'PERSONAL' | null;
}): DriveActionCapabilities {
  const isVirtualFileBrowse = input.projectHubFileBrowse;
  const folderPlacementMode = input.browseFolderPlacements && !isVirtualFileBrowse;
  const inSystemLibrary = input.selectedSpaceKey === 'system' && input.browseSystemLibraryUploads;

  let libraryRecordLink: DriveLibraryRecordLink | null = input.systemLibraryLink;
  if (isVirtualFileBrowse && input.libraryEntityFolderScope) {
    const params = resolveProjectHubFileListParams(
      input.libraryEntityFolderScope.scopeEntityId,
      input.projectHubView,
      {},
    );
    libraryRecordLink =
      params.entityType && params.entityId
        ? { entityType: params.entityType, entityId: params.entityId }
        : null;
  }

  const scopedFolderTree = folderPlacementMode && Boolean(input.libraryEntityFolderScope);
  const companyOrPersonal = Boolean(input.driveStorageSpace);
  const canCopyIntoFolderTree =
    scopedFolderTree ||
    companyOrPersonal ||
    (isVirtualFileBrowse && inSystemLibrary && Boolean(libraryRecordLink));

  return {
    showFolderBulkSelection: folderPlacementMode,
    showFolderRowActions: folderPlacementMode,
    showFolderFileDragDrop: folderPlacementMode && Boolean(input.placementFolderId),
    canRemoveFromFolder: folderPlacementMode && Boolean(input.placementFolderId),
    canMovePlacementInTree: folderPlacementMode && Boolean(input.placementFolderId),
    canCopyIntoFolderTree,
    canShareFile:
      companyOrPersonal || folderPlacementMode || (inSystemLibrary && Boolean(libraryRecordLink)),
    libraryRecordLink: inSystemLibrary ? libraryRecordLink : null,
    canUnlinkFromRecord: inSystemLibrary && Boolean(libraryRecordLink),
    canPlaceInCompanyFolder: inSystemLibrary && Boolean(libraryRecordLink),
    isVirtualFileBrowse,
  };
}

/** Finds the active FileLink row for the current library record. */
export function findLibraryRecordFileLink(
  file: {
    links: readonly {
      id: string;
      entityType: string;
      entityId: string;
      unlinkedAt: string | null;
    }[];
  },
  record: DriveLibraryRecordLink,
): { id: string } | null {
  const entityType = record.entityType.trim().toUpperCase();
  const entityId = record.entityId.trim();
  const match = file.links.find(
    (link) =>
      link.entityType.toUpperCase() === entityType &&
      link.entityId === entityId &&
      link.unlinkedAt == null,
  );
  return match ? { id: match.id } : null;
}
