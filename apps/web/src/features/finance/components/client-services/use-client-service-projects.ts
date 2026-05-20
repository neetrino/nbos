'use client';

import { useEffect, useState } from 'react';
import { projectsApi, type Project } from '@/lib/api/projects';

const PROJECTS_PAGE_SIZE = 100;

export function useClientServiceProjects(enabled: boolean): Project[] {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    projectsApi
      .getAll({ page: 1, pageSize: PROJECTS_PAGE_SIZE })
      .then((res) => {
        if (!cancelled) setProjects(res.items);
      })
      .catch(() => {
        if (!cancelled) setProjects([]);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return projects;
}
