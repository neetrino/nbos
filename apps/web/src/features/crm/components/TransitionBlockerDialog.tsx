'use client';

import { useState } from 'react';
import { AlertTriangle, ExternalLink, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import type { ApiFieldError } from '@/lib/api-errors';

export interface TransitionBlockerState<TItem> {
  item: TItem;
  targetStatus: string;
  targetLabel: string;
  errors: ApiFieldError[];
  message: string;
}

export interface TransitionBlockerAction {
  key: string;
  label: string;
  onClick: () => void;
}

interface TransitionBlockerDialogProps<TItem> {
  open: boolean;
  blocker: TransitionBlockerState<TItem> | null;
  entityLabel: string;
  itemLabel: string;
  onOpenChange: (open: boolean) => void;
  onOpenDetails: () => void;
  onRetry: () => Promise<void>;
  directActions?: TransitionBlockerAction[];
  businessActionLabel?: string;
  onBusinessAction?: () => void;
  onOverride?: (reason: string) => Promise<void>;
}

const ACTION_BLOCKER_FIELDS = new Set(['invoice', 'payment', 'contract', 'override']);

export function TransitionBlockerDialog<TItem>({
  open,
  blocker,
  entityLabel,
  itemLabel,
  onOpenChange,
  onOpenDetails,
  onRetry,
  directActions = [],
  businessActionLabel,
  onBusinessAction,
  onOverride,
}: TransitionBlockerDialogProps<TItem>) {
  const [overrideReason, setOverrideReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const missingFields = blocker?.errors.filter((error) => !isActionBlocker(error)) ?? [];
  const actionBlockers = blocker?.errors.filter(isActionBlocker) ?? [];
  const canOverride = Boolean(onOverride && blocker?.targetStatus === 'WON');

  const runAction = async (action: () => Promise<void>) => {
    setSaving(true);
    setActionError(null);
    try {
      await action();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Action failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            Stage move blocked
          </DialogTitle>
          <DialogDescription>
            {entityLabel} {itemLabel} cannot move to {blocker?.targetLabel ?? 'the target stage'}
            until the required details are complete.
          </DialogDescription>
        </DialogHeader>

        {blocker && (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              {blocker.message}
            </div>

            {missingFields.length > 0 && (
              <section className="space-y-2">
                <h4 className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
                  Missing fields
                </h4>
                <div className="space-y-2">
                  {missingFields.map((error) => (
                    <BlockerRow key={`${error.field}-${error.message}`} error={error} />
                  ))}
                </div>
              </section>
            )}

            {actionBlockers.length > 0 && (
              <section className="space-y-2">
                <h4 className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
                  Business blockers
                </h4>
                <div className="space-y-2">
                  {actionBlockers.map((error) => (
                    <BlockerRow key={`${error.field}-${error.message}`} error={error} />
                  ))}
                </div>
              </section>
            )}

            {canOverride && (
              <section className="space-y-2">
                <h4 className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
                  Privileged override
                </h4>
                <Textarea
                  value={overrideReason}
                  onChange={(event) => setOverrideReason(event.target.value)}
                  placeholder="Explain why Deal Won should proceed before Finance marks the invoice as paid."
                />
                <p className="text-muted-foreground text-xs">
                  Override does not mark invoices paid. Finance still owns payment confirmation.
                </p>
              </section>
            )}

            {actionError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {actionError}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {directActions.map((action) => (
            <Button key={action.key} type="button" variant="outline" onClick={action.onClick}>
              {action.label}
            </Button>
          ))}
          {onBusinessAction && businessActionLabel && (
            <Button type="button" variant="outline" onClick={onBusinessAction}>
              {businessActionLabel}
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onOpenDetails}>
            <ExternalLink size={14} />
            Open details
          </Button>
          {canOverride && (
            <Button
              type="button"
              variant="secondary"
              disabled={saving || !overrideReason.trim()}
              onClick={() => {
                if (!onOverride) return;
                runAction(() => onOverride(overrideReason.trim()));
              }}
            >
              Apply override
            </Button>
          )}
          <Button type="button" disabled={saving} onClick={() => runAction(onRetry)}>
            <RefreshCcw size={14} />
            Retry move
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BlockerRow({ error }: { error: ApiFieldError }) {
  return (
    <div className="border-border bg-card rounded-lg border p-3">
      <p className="text-sm font-medium">{formatFieldLabel(error.field)}</p>
      <p className="text-muted-foreground mt-1 text-sm">{error.message}</p>
    </div>
  );
}

function isActionBlocker(error: ApiFieldError): boolean {
  const field = error.field.toLowerCase();
  return [...ACTION_BLOCKER_FIELDS].some((keyword) => field.includes(keyword));
}

function formatFieldLabel(field: string): string {
  const knownLabels: Record<string, string> = {
    source: 'From',
    sourceDetail: 'Where',
    sourcePartnerId: 'Partner',
    sourceContactId: 'Client / referral contact',
    whichOne: 'Which one',
    amount: 'Amount',
    paymentType: 'Payment type',
    productCategory: 'Product category',
    productType: 'Product type',
    pmId: 'Project manager',
    deadline: 'Deadline',
    existingProductId: 'Existing product',
  };
  return knownLabels[field] ?? field.replace(/([A-Z])/g, ' $1').trim();
}
