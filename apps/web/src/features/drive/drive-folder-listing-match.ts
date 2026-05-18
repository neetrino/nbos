import type { DriveFolderListing } from '@/lib/api/drive';
import type { DriveEntityFolderScope } from './drive-entity-folder-scope';

/** True when a folder listing response belongs to the current browse context. */
export function folderListingMatchesBrowseContext(
  listing: DriveFolderListing | null,
  entityScope: DriveEntityFolderScope | null,
  driveSpace: 'COMPANY' | 'PERSONAL' | null,
): listing is DriveFolderListing {
  if (!listing) return false;
  if (entityScope) {
    return (
      listing.scopeEntityType === entityScope.scopeEntityType &&
      listing.scopeEntityId === entityScope.scopeEntityId
    );
  }
  if (driveSpace) {
    return listing.space === driveSpace && !listing.scopeEntityType && !listing.scopeEntityId;
  }
  return false;
}
