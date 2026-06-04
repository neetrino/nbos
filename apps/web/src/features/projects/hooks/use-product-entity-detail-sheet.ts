'use client';

import { useCallback, useState } from 'react';

/** Local entity detail sheet state for product detail tabs (no module navigation). */
export function useProductEntityDetailSheet<T extends string = string>() {
  const [entityId, setEntityId] = useState<T | null>(null);

  const openEntity = useCallback((id: T) => {
    setEntityId(id);
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setEntityId(null);
    }
  }, []);

  return {
    entityId,
    openEntity,
    isOpen: entityId !== null,
    handleOpenChange,
  };
}
