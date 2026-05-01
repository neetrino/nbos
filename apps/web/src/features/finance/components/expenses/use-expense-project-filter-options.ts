import { useEffect, useState } from 'react';
import { projectsApi } from '@/lib/api/projects';
import { PROJECTS_PAGE_SIZE } from './edit-expense-dialog-constants';

export function useExpenseProjectFilterOptions() {
  const [projectFilterOptions, setProjectFilterOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);

  useEffect(() => {
    let cancelled = false;
    projectsApi
      .getAll({ page: 1, pageSize: PROJECTS_PAGE_SIZE })
      .then((res) => {
        if (!cancelled) {
          setProjectFilterOptions(
            res.items.map((p) => ({ value: p.id, label: `${p.code} · ${p.name}` })),
          );
        }
      })
      .catch(() => {
        if (!cancelled) setProjectFilterOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return projectFilterOptions;
}
