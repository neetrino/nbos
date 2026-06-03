'use client';

import { useEffect, useState } from 'react';
import { driveApi } from '@/lib/api/drive';

export function useDriveFileAllowedActions(
  fileId: string | null,
  targetFolderSpace?: 'COMPANY' | 'PERSONAL',
): readonly string[] | null {
  const [actions, setActions] = useState<readonly string[] | null>(null);

  useEffect(() => {
    if (!fileId) {
      setActions(null);
      return;
    }
    let cancelled = false;
    setActions(null);
    void driveApi
      .getFileAllowedActions(fileId, targetFolderSpace)
      .then((result) => {
        if (!cancelled) setActions(result.actions);
      })
      .catch(() => {
        if (!cancelled) setActions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [fileId, targetFolderSpace]);

  return actions;
}
