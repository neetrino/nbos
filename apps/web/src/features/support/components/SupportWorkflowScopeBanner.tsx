'use client';

import { useTranslations } from 'next-intl';
import type { BoardLifecycleScope } from '@/features/shared/board-lifecycle';

export function SupportWorkflowScopeBanner({ scope }: { scope: BoardLifecycleScope }) {
  const t = useTranslations('support');

  if (scope !== 'CLOSED') return null;

  return <p className="text-muted-foreground shrink-0 text-xs">{t('banner.closedHint')}</p>;
}
