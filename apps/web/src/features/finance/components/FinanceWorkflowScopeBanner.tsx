'use client';

import {
  FINANCE_WORKFLOW_SCOPE_HINTS,
  type FinanceWorkflowScopeVariant,
} from '@/features/finance/constants/finance-workflow-scope-hints';

export type { FinanceWorkflowScopeVariant } from '@/features/finance/constants/finance-workflow-scope-hints';

export function FinanceWorkflowScopeBanner({ variant }: { variant: FinanceWorkflowScopeVariant }) {
  return (
    <p className="text-muted-foreground max-w-prose shrink-0 text-xs">
      {FINANCE_WORKFLOW_SCOPE_HINTS[variant]}
    </p>
  );
}
