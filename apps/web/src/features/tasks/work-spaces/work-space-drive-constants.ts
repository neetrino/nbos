import { DRIVE_LIBRARIES } from '@/features/drive/drive-options';

export const WORK_SPACE_DRIVE_ENTITY_TYPE = 'WORK_SPACE';

export const WORKSPACE_DRIVE_DEFAULT_PURPOSE = 'WORKSPACE_ARTIFACT';

export const WORKSPACE_DRIVE_LIBRARY =
  DRIVE_LIBRARIES.find((item) => item.key === 'tasks') ??
  DRIVE_LIBRARIES.find((item) => item.key === 'all')!;
