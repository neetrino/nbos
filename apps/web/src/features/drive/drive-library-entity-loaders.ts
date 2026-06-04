import { driveApi } from '@/lib/api/drive';
import { ApiError } from '@/lib/api-errors';
import type { DriveLibraryKey } from './drive-options';

export type DriveLibraryEntityRow = {
  id: string;
  /** Primary display name (e.g. project title without code prefix). */
  label: string;
  entityType: string;
  /** Optional record code shown as a small badge (e.g. P-2026-0005). */
  code?: string;
};

export function buildDriveLibraryEntityRow(params: {
  id: string;
  entityType: string;
  name: string;
  code?: string | null;
}): DriveLibraryEntityRow {
  const label = params.name.trim() || 'Untitled';
  const code = params.code?.trim();
  return {
    id: params.id,
    entityType: params.entityType,
    label,
    ...(code ? { code } : {}),
  };
}

/** Merges API rows with pinned rows (e.g. deep-linked project) without duplicates. */
export function mergeDriveLibraryEntityRows(
  base: DriveLibraryEntityRow[],
  pinned?: readonly DriveLibraryEntityRow[],
): DriveLibraryEntityRow[] {
  if (!pinned?.length) return base;
  const map = new Map<string, DriveLibraryEntityRow>();
  for (const row of pinned) {
    map.set(`${row.entityType}:${row.id}`, row);
  }
  for (const row of base) {
    const k = `${row.entityType}:${row.id}`;
    if (!map.has(k)) map.set(k, row);
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
}

const SYSTEM_ENTITY_LIBRARIES: DriveLibraryKey[] = [
  'deals',
  'projects',
  'products',
  'clients',
  'finance',
  'partners',
  'tasks',
  'support',
];

const isSystemEntityLibrary = (key: DriveLibraryKey): boolean =>
  SYSTEM_ENTITY_LIBRARIES.includes(key);

/** Loads System Library grid rows using Drive participation rules (matches folder tree access). */
export async function loadDriveLibraryEntityRows(
  libraryKey: DriveLibraryKey,
): Promise<DriveLibraryEntityRow[]> {
  if (!isSystemEntityLibrary(libraryKey)) return [];

  try {
    const { items } = await driveApi.listLibraryEntities(libraryKey);
    return items.map((item) => ({
      id: item.id,
      entityType: item.entityType,
      label: item.label,
      ...(item.code ? { code: item.code } : {}),
    }));
  } catch (err: unknown) {
    if (err instanceof ApiError && err.statusCode === 404) {
      return [];
    }
    throw err;
  }
}
