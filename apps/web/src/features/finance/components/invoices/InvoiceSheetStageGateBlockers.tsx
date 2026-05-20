'use client';

import type { ApiFieldError } from '@/lib/api-errors';
import type { InvoiceSheetStageGateHighlight } from '@/features/finance/constants/invoice-stage-gate-highlight';

export function InvoiceSheetStageGateBlockers({
  highlight,
}: {
  highlight: InvoiceSheetStageGateHighlight | null;
}) {
  if (!highlight?.errors.length) return null;

  return (
    <div className="border-destructive/30 bg-destructive/5 space-y-1 rounded-xl border p-3">
      <p className="text-destructive text-xs font-semibold">Complete before moving status</p>
      <ul className="text-muted-foreground space-y-1 text-xs">
        {highlight.errors.map((error: ApiFieldError) => (
          <li key={`${error.field}-${error.message}`}>{error.message}</li>
        ))}
      </ul>
    </div>
  );
}
