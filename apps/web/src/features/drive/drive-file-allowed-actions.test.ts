import { describe, expect, it } from 'vitest';
import type { FileAsset } from '@/lib/api/drive';
import {
  applyServerFileActionGates,
  buildDriveFileActionGates,
} from './drive-file-allowed-actions';
import type { DriveActionCapabilities } from './drive-action-capabilities';

const layoutCaps: DriveActionCapabilities = {
  showFolderBulkSelection: true,
  showFolderRowActions: true,
  showFolderFileDragDrop: true,
  canRemoveFromFolder: true,
  canMovePlacementInTree: true,
  canCopyIntoFolderTree: true,
  canShareFile: true,
  libraryRecordLink: null,
  canUnlinkFromRecord: false,
  canPlaceInCompanyFolder: false,
  isVirtualFileBrowse: false,
};

const activeFile = {
  id: 'f1',
  status: 'ACTIVE',
  storageProvider: 'R2',
} as FileAsset;

describe('applyServerFileActionGates', () => {
  it('intersects layout with server actions', () => {
    const merged = applyServerFileActionGates(layoutCaps, ['SHARE', 'MOVE_PLACEMENT']);
    expect(merged.canShareFile).toBe(true);
    expect(merged.canCopyIntoFolderTree).toBe(false);
    expect(merged.canMovePlacementInTree).toBe(true);
  });
});

describe('buildDriveFileActionGates', () => {
  it('enables move to trash for active files when server allows trash actions', () => {
    const gates = buildDriveFileActionGates(layoutCaps, activeFile, ['PERMANENT_DELETE', 'SHARE']);
    expect(gates.canMoveToTrash).toBe(true);
    expect(gates.canArchive).toBe(false);
  });

  it('enables restore for recoverable trash rows', () => {
    const gates = buildDriveFileActionGates(layoutCaps, { ...activeFile, status: 'ARCHIVED' }, [
      'PERMANENT_DELETE',
    ]);
    expect(gates.canRestore).toBe(true);
    expect(gates.canMoveToTrash).toBe(false);
  });

  it('denies copy when server omits COPY', () => {
    const gates = buildDriveFileActionGates(layoutCaps, activeFile, ['SHARE']);
    expect(gates.canCopy).toBe(false);
    expect(gates.canShare).toBe(true);
  });
});
