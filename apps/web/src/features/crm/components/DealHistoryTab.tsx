'use client';

import { useTranslations } from 'next-intl';
import { History } from 'lucide-react';
import { DetailSheetPlaceholderTab } from '@/components/shared';

export function DealHistoryTab() {
  const t = useTranslations('crm');
  return (
    <DetailSheetPlaceholderTab
      icon={History}
      title={t('dealSheet.historyTitle')}
      description={t('dealSheet.historyDescription')}
    />
  );
}
