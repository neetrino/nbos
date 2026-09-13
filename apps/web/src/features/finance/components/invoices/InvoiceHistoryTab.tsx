'use client';

import { History } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DetailSheetPlaceholderTab } from '@/components/shared';

export function InvoiceHistoryTab() {
  const t = useTranslations('invoices');
  return (
    <DetailSheetPlaceholderTab
      icon={History}
      title={t('history.comingSoonTitle')}
      description={t('history.comingSoonDescription')}
    />
  );
}
