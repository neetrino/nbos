'use client';

import { useCallback, useState } from 'react';

/** Local entity detail sheet state for product detail tabs (no module navigation). */
export function useProductEntityDetailSheet<TEntity extends { id: string }>() {
  const [entityId, setEntityId] = useState<string | null>(null);
  const [seedEntity, setSeedEntity] = useState<TEntity | null>(null);

  const openEntity = useCallback((entityOrId: TEntity | string) => {
    if (typeof entityOrId === 'string') {
      setEntityId(entityOrId);
      setSeedEntity(null);
      return;
    }
    setEntityId(entityOrId.id);
    setSeedEntity(entityOrId);
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setEntityId(null);
      setSeedEntity(null);
    }
  }, []);

  return {
    entityId,
    seedEntity,
    openEntity,
    isOpen: entityId !== null,
    handleOpenChange,
  };
}
