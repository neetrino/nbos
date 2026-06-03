import { driveApi, type DriveFolderListing } from '@/lib/api/drive';

/** Ensures folder/file rows include manualGrantCount even if list response omitted it. */
export async function enrichDriveFolderListing(
  listing: DriveFolderListing,
): Promise<DriveFolderListing> {
  const folderIds = listing.folders.map((f) => f.id);
  const fileIds = listing.files.map((f) => f.id);

  const [folderCounts, fileCounts] = await Promise.all([
    folderIds.length > 0
      ? driveApi.getFolderGrantCounts(folderIds)
      : Promise.resolve({} as Record<string, number>),
    fileIds.length > 0
      ? driveApi.getFileGrantCounts(fileIds)
      : Promise.resolve({} as Record<string, number>),
  ]);

  return {
    ...listing,
    folders: listing.folders.map((folder) => {
      const fromBatch = folderCounts[folder.id];
      const merged = Math.max(folder.manualGrantCount ?? 0, fromBatch ?? 0);
      return { ...folder, manualGrantCount: merged };
    }),
    files: listing.files.map((file) => {
      const fromBatch = fileCounts[file.id];
      const merged = Math.max(file.manualGrantCount ?? 0, fromBatch ?? 0);
      return { ...file, manualGrantCount: merged };
    }),
  };
}
