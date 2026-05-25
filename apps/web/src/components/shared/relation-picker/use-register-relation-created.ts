'use client';

import { useEffect } from 'react';
import { registerRelationCreatedHandler } from './relation-created-registry';
import type { RelationCreatedEvent } from './relation-created-event';

/** Subscribes to global relation-create events while the component is mounted. */
export function useRegisterRelationCreated(
  handler: ((event: RelationCreatedEvent) => void) | null,
): void {
  useEffect(() => {
    if (!handler) return;
    return registerRelationCreatedHandler(handler);
  }, [handler]);
}
