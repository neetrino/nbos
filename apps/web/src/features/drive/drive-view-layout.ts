import type { DriveViewMode } from './drive-options';

export const DRIVE_VIEW_MODES: DriveViewMode[] = ['cards', 'tiles', 'list', 'table'];

export const DRIVE_FOLDER_CARDS_GRID_CLASS =
  'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7';

export const DRIVE_TILES_GRID_CLASS = 'grid gap-2 sm:grid-cols-2 lg:grid-cols-3';

export function parseDriveViewMode(raw: string | null): DriveViewMode | null {
  if (raw === 'cards' || raw === 'tiles' || raw === 'list' || raw === 'table') {
    return raw;
  }
  return null;
}

export function driveFolderRowLayout(viewMode: DriveViewMode): 'cards' | 'list' | 'tiles' {
  if (viewMode === 'list') return 'list';
  if (viewMode === 'tiles') return 'tiles';
  return 'cards';
}

export function driveFileCardLayout(viewMode: DriveViewMode): 'grid' | 'list' | 'tiles' {
  if (viewMode === 'list') return 'list';
  if (viewMode === 'tiles') return 'tiles';
  return 'grid';
}

export function driveItemsContainerClass(viewMode: DriveViewMode): string {
  if (viewMode === 'tiles') return DRIVE_TILES_GRID_CLASS;
  if (viewMode === 'cards') return DRIVE_FOLDER_CARDS_GRID_CLASS;
  return 'space-y-2';
}
