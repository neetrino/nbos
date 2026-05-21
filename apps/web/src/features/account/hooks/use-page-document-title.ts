import { useEffect } from 'react';

const APP_TITLE_SUFFIX = 'NBOS';

/** Sets `document.title` for non-module pages (e.g. My Account, Wallet). */
export function usePageDocumentTitle(pageTitle: string) {
  useEffect(() => {
    if (!pageTitle.trim()) return;
    const previousTitle = document.title;
    document.title = `${pageTitle.trim()} | ${APP_TITLE_SUFFIX}`;
    return () => {
      document.title = previousTitle;
    };
  }, [pageTitle]);
}
