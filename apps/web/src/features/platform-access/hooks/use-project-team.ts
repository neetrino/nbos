'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ProjectTeamMemberRow } from '@/lib/api/platform-access';
import { loadProjectTeam } from '../project-team-request';

export function useProjectTeam(projectId: string, refreshKey = 0) {
  const [members, setMembers] = useState<ProjectTeamMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void loadProjectTeam(projectId)
      .then((rows) => {
        if (cancelled) return;
        setMembers(rows);
      })
      .catch((err) => {
        if (cancelled) return;
        setMembers([]);
        setError(err instanceof Error ? err.message : 'Failed to load participants');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectId, refreshKey]);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await loadProjectTeam(projectId);
      setMembers(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load participants');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  return { members, loading, error, refetch };
}
