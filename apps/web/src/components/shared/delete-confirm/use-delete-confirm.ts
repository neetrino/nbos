'use client';

import { useCallback, useState } from 'react';

export interface DeleteConfirmTarget {
  id: string;
  name: string;
}

export function useDeleteConfirm<T extends DeleteConfirmTarget = DeleteConfirmTarget>() {
  const [target, setTarget] = useState<T | null>(null);

  const request = useCallback((item: T) => {
    setTarget(item);
  }, []);

  const clear = useCallback(() => {
    setTarget(null);
  }, []);

  const onOpenChange = useCallback((open: boolean) => {
    if (!open) setTarget(null);
  }, []);

  return {
    target,
    open: target !== null,
    request,
    clear,
    onOpenChange,
  };
}
