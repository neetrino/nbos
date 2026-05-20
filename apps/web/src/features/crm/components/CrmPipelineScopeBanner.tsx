'use client';

import type { BoardLifecycleScope } from '@/features/shared/board-lifecycle';

const CLOSED_SCOPE_HINT: Record<'lead' | 'deal', string> = {
  lead: 'Showing terminal outcomes only: Lead Won and Spam. Same board and list views as the active pipeline.',
  deal: 'Showing terminal outcomes only: Won and Failed. Same board and list views as the active pipeline.',
};

export function CrmPipelineScopeBanner({
  scope,
  pipeline,
}: {
  scope: BoardLifecycleScope;
  pipeline: 'lead' | 'deal';
}) {
  if (scope !== 'CLOSED') return null;

  return <p className="text-muted-foreground shrink-0 text-xs">{CLOSED_SCOPE_HINT[pipeline]}</p>;
}
