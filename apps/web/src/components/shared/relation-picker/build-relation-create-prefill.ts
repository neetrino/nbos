import { parseRelationSearchName } from './parse-relation-search-name';
import type { RelationCreatePrefill, RelationEntityKind } from './relation-picker.types';

export function buildRelationCreatePrefill(
  kind: RelationEntityKind,
  searchQuery: string,
): RelationCreatePrefill {
  const trimmed = searchQuery.trim();
  if (!trimmed) return {};
  if (kind === 'contact') {
    const { firstName, lastName } = parseRelationSearchName(trimmed);
    return { firstName, lastName, name: trimmed };
  }
  return { name: trimmed };
}
