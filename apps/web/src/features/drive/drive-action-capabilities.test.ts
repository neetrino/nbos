import { describe, expect, it } from 'vitest';
import { DRIVE_PROJECT_HUB_DEFAULT_VIEW } from './drive-project-hub-view';
import { resolveDriveActionCapabilities } from './drive-action-capabilities';

describe('resolveDriveActionCapabilities', () => {
  it('enables folder placement actions in scoped folder mode', () => {
    const caps = resolveDriveActionCapabilities({
      browseFolderPlacements: true,
      projectHubFileBrowse: false,
      browseSystemLibraryUploads: true,
      systemLibraryLink: { entityType: 'TASK', entityId: 'task-1' },
      libraryEntityFolderScope: { scopeEntityType: 'TASK', scopeEntityId: 'task-1' },
      projectHubView: DRIVE_PROJECT_HUB_DEFAULT_VIEW,
      selectedSpaceKey: 'system',
      placementFolderId: 'folder-1',
      driveStorageSpace: null,
    });
    expect(caps.showFolderBulkSelection).toBe(true);
    expect(caps.canRemoveFromFolder).toBe(true);
    expect(caps.canMovePlacementInTree).toBe(true);
    expect(caps.canShareFile).toBe(true);
    expect(caps.isVirtualFileBrowse).toBe(false);
  });

  it('disables folder actions in project hub virtual browse', () => {
    const caps = resolveDriveActionCapabilities({
      browseFolderPlacements: false,
      projectHubFileBrowse: true,
      browseSystemLibraryUploads: true,
      systemLibraryLink: { entityType: 'PROJECT', entityId: 'proj-1' },
      libraryEntityFolderScope: { scopeEntityType: 'PROJECT', scopeEntityId: 'proj-1' },
      projectHubView: { section: 'deals', focusEntityId: 'deal-1' },
      selectedSpaceKey: 'system',
      placementFolderId: null,
      driveStorageSpace: null,
    });
    expect(caps.showFolderBulkSelection).toBe(false);
    expect(caps.canRemoveFromFolder).toBe(false);
    expect(caps.libraryRecordLink).toEqual({ entityType: 'DEAL', entityId: 'deal-1' });
    expect(caps.canUnlinkFromRecord).toBe(true);
    expect(caps.canShareFile).toBe(true);
    expect(caps.canCopyIntoFolderTree).toBe(true);
    expect(caps.isVirtualFileBrowse).toBe(true);
  });
});
