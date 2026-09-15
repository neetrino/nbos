export const CALL_JOURNAL_PAGE_SIZE = 20;

export function journalHasMorePages(meta: { page: number; totalPages: number }): boolean {
  return meta.page < meta.totalPages;
}
