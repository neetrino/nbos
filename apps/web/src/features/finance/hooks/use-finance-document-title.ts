import { useEffect } from 'react';
import { FINANCE_DOCUMENT_TITLE_SUFFIX } from '@/features/finance/constants/finance-document-title';

/**
 * Sets `document.title` while `pageTitle` is a non-empty string; restores the previous title on cleanup
 * or when `pageTitle` changes. Pass `undefined`/`null` to leave the tab title unchanged until a value exists.
 */
export function useFinanceDocumentTitle(pageTitle: string | null | undefined) {
  useEffect(() => {
    if (pageTitle == null || pageTitle === '') return;
    const previousTitle = document.title;
    document.title = `${pageTitle}${FINANCE_DOCUMENT_TITLE_SUFFIX}`;
    return () => {
      document.title = previousTitle;
    };
  }, [pageTitle]);
}
