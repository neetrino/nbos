'use client';

import { useTranslations } from 'next-intl';
import type { BoardLifecycleScope } from '@/features/shared/board-lifecycle';

export function CrmPipelineScopeBanner({
  scope,
  pipeline,
}: {
  scope: BoardLifecycleScope;
  pipeline: 'lead' | 'deal';
}) {
  const t = useTranslations('crm');
  if (scope !== 'CLOSED') return null;

  return (
    <p className="text-muted-foreground shrink-0 text-xs">
      {pipeline === 'lead' ? t('leads.closedScopeHint') : t('deals.closedScopeHint')}
    </p>
  );
}
