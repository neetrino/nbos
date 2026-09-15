'use client';

import type { ReactNode } from 'react';
import { NestedEntitySheetPresenceProvider } from '../nested-entity-sheet-stack';
import { EntityRelationHost } from './EntityRelationHost';
import { emitRelationCreatedHandlers } from './relation-created-registry';
import type { RelationCreatedEvent } from './relation-created-event';

type AppEntityRelationProviderProps = {
  children: ReactNode;
};

/** App-wide relation overlays (sheets + create dialogs). Mount once under {@link AppLayout}. */
export function AppEntityRelationProvider({ children }: AppEntityRelationProviderProps) {
  const handleRelationCreated = (event: RelationCreatedEvent) => {
    emitRelationCreatedHandlers(event);
  };

  return (
    <NestedEntitySheetPresenceProvider>
      <EntityRelationHost onRelationCreated={handleRelationCreated}>{children}</EntityRelationHost>
    </NestedEntitySheetPresenceProvider>
  );
}
