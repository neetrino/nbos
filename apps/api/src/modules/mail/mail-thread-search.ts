import { MAIL_THREAD_SEARCH_QUERY_MAX_CHARS } from './mail-thread-search.constants';

/**
 * Trims inbox thread search input and caps length for safe Prisma `contains` use.
 */
export function normalizeMailThreadSearchQuery(raw: string | undefined): string | undefined {
  if (raw === undefined) {
    return undefined;
  }
  const t = raw.trim();
  if (t.length === 0) {
    return undefined;
  }
  if (t.length <= MAIL_THREAD_SEARCH_QUERY_MAX_CHARS) {
    return t;
  }
  return t.slice(0, MAIL_THREAD_SEARCH_QUERY_MAX_CHARS);
}
