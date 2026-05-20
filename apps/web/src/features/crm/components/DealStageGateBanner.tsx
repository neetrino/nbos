'use client';

import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  formatDealStageGateFieldLabel,
  formatDealStageGateFieldList,
} from '@/features/crm/deal-stage-gate-labels';
import { splitDealStageGateErrors } from '@/features/crm/deal-stage-gate-highlight';
import type { ApiFieldError } from '@/lib/api-errors';

interface StageGateBannerProps {
  targetLabel: string;
  errors: ApiFieldError[];
  onDismiss?: () => void;
  onOpenInvoice?: () => void;
}

export function StageGateBanner({
  targetLabel,
  errors,
  onDismiss,
  onOpenInvoice,
}: StageGateBannerProps) {
  const { fieldErrors, actionBlockers } = splitDealStageGateErrors(errors);
  const fieldNames = fieldErrors.map((error) => error.field);
  const hasInvoiceBlocker = actionBlockers.some((error) =>
    error.field.toLowerCase().includes('invoice'),
  );

  return (
    <div
      role="status"
      className="mx-5 mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="font-medium">Complete required details to move to {targetLabel}</p>
          {fieldNames.length > 0 && (
            <p className="text-amber-900/90 dark:text-amber-100/90">
              Fill: {formatDealStageGateFieldList(fieldNames)}. Highlighted fields are marked in red
              below.
            </p>
          )}
          {actionBlockers.map((error) => (
            <p
              key={`${error.field}-${error.message}`}
              className="text-amber-900/80 dark:text-amber-100/80"
            >
              {error.message}
            </p>
          ))}
          {hasInvoiceBlocker && onOpenInvoice && (
            <Button type="button" variant="outline" size="sm" onClick={onOpenInvoice}>
              Open invoice tab
            </Button>
          )}
        </div>
        {onDismiss && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-amber-800 hover:bg-amber-100 dark:text-amber-200 dark:hover:bg-amber-900/50"
            aria-label="Dismiss stage requirements notice"
            onClick={onDismiss}
          >
            <X className="size-4" />
          </Button>
        )}
      </div>
      {fieldErrors.length > 0 && (
        <ul className="mt-2 list-inside list-disc text-xs text-amber-900/80 dark:text-amber-100/75">
          {fieldErrors.map((error) => (
            <li key={`${error.field}-${error.message}`}>
              {formatDealStageGateFieldLabel(error.field)} — {error.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
