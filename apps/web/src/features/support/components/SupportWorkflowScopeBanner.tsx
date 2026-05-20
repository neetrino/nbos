'use client';

import type { BoardLifecycleScope } from '@/features/shared/board-lifecycle';

const CLOSED_HINT =
  'Showing terminal outcomes only: Resolved and Closed. Same board and list views as the active pipeline.';

export function SupportWorkflowScopeBanner({ scope }: { scope: BoardLifecycleScope }) {
  if (scope !== 'CLOSED') return null;

  return <p className="text-muted-foreground shrink-0 text-xs">{CLOSED_HINT}</p>;
}
