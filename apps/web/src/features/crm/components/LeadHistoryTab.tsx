'use client';

import { useTranslations } from 'next-intl';
import { History } from 'lucide-react';
import { DetailSheetPlaceholderTab } from '@/components/shared';

export function LeadHistoryTab() {
  const t = useTranslations('crm');
  return (
    <DetailSheetPlaceholderTab
      icon={History}
      title={t('leadSheet.historyTitle')}
      description={t('leadSheet.historyDescription')}
    />
  );
}
