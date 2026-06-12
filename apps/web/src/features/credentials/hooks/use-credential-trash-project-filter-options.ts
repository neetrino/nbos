'use client';

import { useEffect, useState } from 'react';
import { projectsApi } from '@/lib/api/projects';

export interface CredentialTrashProjectFilterOption {
  value: string;
  label: string;
}

/** Loads project names for the trash list project filter. */
export function useCredentialTrashProjectFilterOptions(enabled: boolean) {
  const [options, setOptions] = useState<CredentialTrashProjectFilterOption[]>([]);

  useEffect(() => {
    if (!enabled) {
      setOptions([]);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const { items } = await projectsApi.getAll({ pageSize: 200, scope: 'active' });
        if (cancelled) return;
        const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));
        setOptions(sorted.map((project) => ({ value: project.id, label: project.name })));
      } catch {
        if (!cancelled) setOptions([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { projectFilterOptions: options };
}
