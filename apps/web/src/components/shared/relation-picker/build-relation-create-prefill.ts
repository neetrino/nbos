import { parseRelationSearchName } from './parse-relation-search-name';
import { parseRelationCreateIntent } from './parse-relation-create-intent';
import type {
  RelationCreateContext,
  RelationCreatePrefill,
  RelationEntityKind,
} from './relation-picker.types';

export function buildRelationCreatePrefill(
  kind: RelationEntityKind,
  searchQuery: string,
  context?: RelationCreateContext,
  intent?: string,
): RelationCreatePrefill {
  const trimmed = searchQuery.trim();
  const { projectId: intentProjectId } = parseRelationCreateIntent(intent);
  const projectId = context?.projectId ?? intentProjectId;
  const base: RelationCreatePrefill = projectId ? { projectId } : {};

  if (!trimmed) return base;
  if (kind === 'contact') {
    const { firstName, lastName } = parseRelationSearchName(trimmed);
    return { ...base, firstName, lastName, name: trimmed };
  }
  return { ...base, name: trimmed };
}
