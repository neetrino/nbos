'use client';

import { History } from 'lucide-react';
import { DetailSheetPlaceholderTab } from '@/components/shared';
import { useExpensePlansT } from './expense-plan-message-keys';

export function ExpensePlanHistoryTab() {
  const t = useExpensePlansT();
  return (
    <DetailSheetPlaceholderTab
      icon={History}
      title={t('history.title')}
      description={t('history.description')}
    />
  );
}
