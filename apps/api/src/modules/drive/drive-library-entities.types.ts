export const DRIVE_LIBRARY_ENTITY_KEYS = [
  'deals',
  'projects',
  'products',
  'clients',
  'finance',
  'partners',
  'tasks',
  'support',
] as const;

export type DriveLibraryEntityKey = (typeof DRIVE_LIBRARY_ENTITY_KEYS)[number];

export type DriveLibraryEntityRowDto = {
  id: string;
  entityType: string;
  label: string;
  code?: string;
};
