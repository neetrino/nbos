'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRevalidationState } from '@/hooks/use-revalidation-state';
import { isAccessRevokedApiError } from '@/lib/api-errors';
import type { ProjectTeamMemberRow } from '@/lib/api/platform-access';
import { loadProjectTeam } from '../project-team-request';

const LOAD_FAILED = 'Failed to load participants';

export function useProjectTeam(projectId: string, refreshKey = 0) {
  const [members, setMembers] = useState<ProjectTeamMemberRow[]>([]);
  const membersRef = useRef(members);
  membersRef.current = members;
  const [loadedProjectId, setLoadedProjectId] = useState<string | null>(null);
  const loadedProjectIdRef = useRef<string | null>(null);
  const { loading, begin: beginLoad, end: endLoad } = useRevalidationState();
  const [error, setError] = useState<string | null>(null);

  const applySuccess = useCallback((rows: ProjectTeamMemberRow[], forProjectId: string) => {
    setMembers(rows);
    setLoadedProjectId(forProjectId);
    loadedProjectIdRef.current = forProjectId;
    setError(null);
  }, []);

  const applyFailure = useCallback((caught: unknown, forProjectId: string) => {
    if (isAccessRevokedApiError(caught) || loadedProjectIdRef.current !== forProjectId) {
      setMembers([]);
      setLoadedProjectId(null);
      loadedProjectIdRef.current = null;
    }
    setError(caught instanceof Error ? caught.message : LOAD_FAILED);
  }, []);

  useEffect(() => {
    let cancelled = false;
    beginLoad(loadedProjectIdRef.current === projectId && membersRef.current.length > 0);

    void loadProjectTeam(projectId)
      .then((rows) => {
        if (!cancelled) applySuccess(rows, projectId);
      })
      .catch((caught: unknown) => {
        if (!cancelled) applyFailure(caught, projectId);
      })
      .finally(() => {
        if (!cancelled) endLoad();
      });

    return () => {
      cancelled = true;
    };
  }, [applyFailure, applySuccess, beginLoad, endLoad, projectId, refreshKey]);

  const refetch = useCallback(async () => {
    beginLoad(loadedProjectIdRef.current === projectId && membersRef.current.length > 0);
    try {
      const rows = await loadProjectTeam(projectId);
      applySuccess(rows, projectId);
    } catch (caught) {
      applyFailure(caught, projectId);
    } finally {
      endLoad();
    }
  }, [applyFailure, applySuccess, beginLoad, endLoad, projectId]);

  return {
    members,
    loading,
    error,
    clearError: () => setError(null),
    loadedProjectId,
    refetch,
  };
}
