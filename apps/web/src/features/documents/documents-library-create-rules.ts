/**
 * Centralised creation rules for Documents Library categories.
 *
 * folder-only  — user may create folders but NOT bare documents (Deals, Projects, …)
 * folder+file  — user may create both folders and documents (Support)
 *
 * Keys must match DOCUMENTS_VALID_LIBRARY_KEYS from the backend and
 * the keys defined in DRIVE_LIBRARIES (drive-options.ts).
 */

export const LIBRARY_FOLDER_ONLY_KEYS = new Set([
  'deals',
  'projects',
  'products',
  'clients',
  'finance',
  'partners',
  'tasks',
]);

export const LIBRARY_FOLDER_AND_FILE_KEYS = new Set(['support']);

/** True when a folder may be created inside the given Library category. */
export function canCreateFolderInLibrary(libraryKey: string): boolean {
  return LIBRARY_FOLDER_ONLY_KEYS.has(libraryKey) || LIBRARY_FOLDER_AND_FILE_KEYS.has(libraryKey);
}

/** True when a bare document may be created directly in the given Library category. */
export function canCreateDocumentInLibrary(libraryKey: string): boolean {
  return LIBRARY_FOLDER_AND_FILE_KEYS.has(libraryKey);
}
