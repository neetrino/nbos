import type { CrmTranslate } from './crm-copy';

export type LeadStageConfirmCopy = {
  title: string;
  description: string;
  confirmLabel: string;
  variant: 'success' | 'danger';
};

export function getLeadSpamOrSqlConfirmCopy(
  t: CrmTranslate,
  status: string,
): LeadStageConfirmCopy | null {
  if (status === 'SPAM') {
    return {
      title: t('leads.confirmSpamTitle'),
      description: t('leads.confirmSpamDescription'),
      confirmLabel: t('leads.confirmSpamAction'),
      variant: 'danger',
    };
  }
  if (status === 'SQL') {
    return {
      title: t('leads.confirmWonTitle'),
      description: t('leads.confirmWonDescription'),
      confirmLabel: t('leads.confirmWonAction'),
      variant: 'success',
    };
  }
  return null;
}
