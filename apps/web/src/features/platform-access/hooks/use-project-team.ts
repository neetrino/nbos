'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ProjectTeamMemberRow } from '@/lib/api/platform-access';
import { loadProjectTeam, readProjectTeamCache } from '../project-team-cache';

export function useProjectTeam(projectId: string, refreshKey = 0) {
  const [members, setMembers] = useState<ProjectTeamMemberRow[]>(() => {
    return readProjectTeamCache(projectId) ?? [];
  });
  const [loading, setLoading] = useState(() => readProjectTeamCache(projectId) === null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const cached = readProjectTeamCache(projectId);

    if (cached) {
      setMembers(cached);
      setLoading(false);
      setRefreshing(true);
      setError(null);
    } else {
      setLoading(true);
      setRefreshing(false);
    }

    void loadProjectTeam(projectId)
      .then((rows) => {
        if (cancelled) return;
        setMembers(rows);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        if (!cached) {
          setMembers([]);
          setError(err instanceof Error ? err.message : 'Failed to load participants');
        }
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        setRefreshing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectId, refreshKey]);

  const refetch = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const rows = await loadProjectTeam(projectId);
      setMembers(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load participants');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [projectId]);

  return { members, loading, refreshing, error, refetch };
}
