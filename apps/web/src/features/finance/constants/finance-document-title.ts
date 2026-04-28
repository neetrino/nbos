/** Browser tab title suffix for Finance routes (aligned with root layout metadata). */
export const FINANCE_DOCUMENT_TITLE_SUFFIX = ' · Finance · NBOS';

/** Full browser tab title for a Finance screen (page label + canonical suffix). */
export function buildFinanceDocumentTitle(pageTitle: string): string {
  return `${pageTitle}${FINANCE_DOCUMENT_TITLE_SUFFIX}`;
}
