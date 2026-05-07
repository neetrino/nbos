'use client';

import { usePermission } from '@/lib/permissions';

/**
 * Task `creatorId` must be a real Employee id (FK). Session `/api/me` provides it as `me.id`.
 */
export function useTaskCreatorId(): { creatorId: string | null; creatorReady: boolean } {
  const { me, isLoading } = usePermission();
  return { creatorId: me?.id ?? null, creatorReady: !isLoading };
}
