'use client';

import { useEffect, useState } from 'react';
import { projectsApi } from '@/lib/api/projects';

/**
 * Loads project label for the expense drill-down banner when `projectId` is present.
 */
export function useExpenseProjectBannerLabel(projectIdFromUrl: string | null): string | null {
  const [projectBanner, setProjectBanner] = useState<{ id: string; text: string } | null>(null);

  useEffect(() => {
    if (!projectIdFromUrl) return;
    let cancelled = false;
    projectsApi
      .getById(projectIdFromUrl)
      .then((p) => {
        if (!cancelled) {
          setProjectBanner({ id: projectIdFromUrl, text: `${p.code} · ${p.name}` });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProjectBanner({ id: projectIdFromUrl, text: '' });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [projectIdFromUrl]);

  if (!projectIdFromUrl || projectBanner?.id !== projectIdFromUrl) return null;
  return projectBanner.text || null;
}
