import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { SEARCH_MAX_QUERY_LENGTH, SEARCH_MIN_QUERY_LENGTH } from '../search.constants';
import type { SearchQueryGroup } from '../search.types';
import { SEARCH_QUERY_GROUPS } from '../search.constants';

export class SearchQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(SEARCH_MAX_QUERY_LENGTH)
  q?: string;

  @IsOptional()
  @IsIn(SEARCH_QUERY_GROUPS)
  group?: SearchQueryGroup;
}

export function normalizeSearchQuery(raw?: string): string {
  return raw?.trim().slice(0, SEARCH_MAX_QUERY_LENGTH) ?? '';
}

export function isSearchQueryLongEnough(query: string): boolean {
  return query.length >= SEARCH_MIN_QUERY_LENGTH;
}
