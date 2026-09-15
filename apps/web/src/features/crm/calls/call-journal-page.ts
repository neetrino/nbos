export const CALL_JOURNAL_PAGE_SIZE = 50;

export function journalHasMorePages(meta: { page: number; totalPages: number }): boolean {
  return meta.page < meta.totalPages;
}
