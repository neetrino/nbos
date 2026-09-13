import type { CrmTranslate } from './crm-copy';

export type DealStageConfirmCopy = {
  title: string;
  description: string;
  confirmLabel: string;
  variant: 'success' | 'danger';
};

export function getDealWonOrFailedConfirmCopy(
  t: CrmTranslate,
  status: string,
): DealStageConfirmCopy | null {
  if (status === 'WON') {
    return {
      title: t('deals.confirmWonTitle'),
      description: t('deals.confirmWonDescription'),
      confirmLabel: t('deals.confirmWonAction'),
      variant: 'success',
    };
  }
  if (status === 'FAILED') {
    return {
      title: t('deals.confirmFailedTitle'),
      description: t('deals.confirmFailedDescription'),
      confirmLabel: t('deals.confirmFailedAction'),
      variant: 'danger',
    };
  }
  return null;
}
