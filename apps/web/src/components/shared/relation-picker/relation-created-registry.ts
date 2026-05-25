import type { RelationCreatedEvent } from './relation-created-event';

const handlers = new Set<(event: RelationCreatedEvent) => void>();

/** Registers a handler; returns unsubscribe. Used by sheets that patch draft on create. */
export function registerRelationCreatedHandler(
  handler: (event: RelationCreatedEvent) => void,
): () => void {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}

export function emitRelationCreatedHandlers(event: RelationCreatedEvent): void {
  handlers.forEach((handler) => handler(event));
}
