import { useTranslations } from 'next-intl';

/** Shared Close / Copy / Open / Back labels for entity sheet rails. */
export function useSheetChromeCopy() {
  const t = useTranslations('common');
  return {
    close: t('close'),
    closePanel: t('sheet.closePanel'),
    back: t('sheet.back'),
    copyLink: t('sheet.copyLink'),
    copyPageLink: t('sheet.copyPageLink'),
    linkCopied: t('sheet.linkCopied'),
    copyFailed: t('sheet.copyFailed'),
    open: t('sheet.open'),
    openRecord: t('sheet.openRecord'),
    openWorkspace: t('sheet.openWorkspace'),
    dashboard: t('sheet.dashboard'),
  };
}
