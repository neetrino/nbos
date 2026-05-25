import { PURPOSE_OPTIONS } from './drive-options';

export type PurposeFilter = 'ALL' | (typeof PURPOSE_OPTIONS)[number];

export interface DriveStats {
  totalFiles: number;
  totalSize: number;
  linkedFiles: number;
  sensitiveFiles: number;
  approvedFiles: number;
}

export const ALL_PURPOSES: PurposeFilter = 'ALL';
