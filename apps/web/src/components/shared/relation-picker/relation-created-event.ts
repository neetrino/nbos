import type { RelationEntityKind } from './relation-picker.types';

export type RelationCreatedEvent = {
  kind: RelationEntityKind;
  id: string;
  label: string;
  /** Disambiguates when several pickers share the same entity kind on one form. */
  intent?: string;
};
