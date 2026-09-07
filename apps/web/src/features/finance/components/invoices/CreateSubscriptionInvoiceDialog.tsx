'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatAmount } from '@/features/finance/constants/finance';
import { getSubscriptionDisplayTitle } from '@/features/finance/utils/subscription-display';
import type { Subscription } from '@/lib/api/subscriptions';
import { CoverageMonthChecklist } from './CoverageMonthChecklist';
import {
  useCreateSubscriptionInvoiceDialog,
  type CreateSubscriptionInvoiceDialogProps,
} from './use-create-subscription-invoice-dialog';

export type { CreateSubscriptionInvoiceDialogProps };

export function CreateSubscriptionInvoiceDialog(props: CreateSubscriptionInvoiceDialogProps) {
  const state = useCreateSubscriptionInvoiceDialog(props);

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[560px]" forceNestedBackdrop={props.forceNestedBackdrop}>
        <DialogHeader>
          <DialogTitle>Create Subscription Invoice</DialogTitle>
          <DialogDescription>
            Select consecutive months. One invoice covers all selected months.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => void state.handleSubmit(event)} className="space-y-4">
          <SubscriptionInvoiceContext
            loading={state.loading}
            loadError={state.loadError}
            subscription={state.subscription}
            selectedCount={state.coverageMonths.length}
          />
          <CoverageMonthChecklist
            eligibleMonths={state.eligibleMonths}
            coverageMonths={state.coverageMonths}
            coverageMonthCount={state.subscription?.coverageMonthCount ?? 1}
            canAddMonth={state.canAddMonth}
            disabled={state.loading || state.submitting || !state.subscription}
            onToggle={state.toggleCoverageMonth}
          />
          {state.coverageMonths.length > 1 && !state.isConsecutive ? (
            <p className="text-muted-foreground text-sm">Select consecutive months.</p>
          ) : null}
          {state.error ? (
            <p className="text-destructive text-sm" role="alert">
              {state.error}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => state.onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!state.canSubmit || state.submitting}>
              {state.submitting ? 'Creating...' : 'Create Invoice'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SubscriptionInvoiceContext({
  loading,
  loadError,
  subscription,
  selectedCount,
}: {
  loading: boolean;
  loadError: string | null;
  subscription: Subscription | null;
  selectedCount: number;
}) {
  if (loading) {
    return (
      <p className="text-muted-foreground text-sm" role="status">
        Loading subscription…
      </p>
    );
  }
  if (loadError) {
    return (
      <p className="text-destructive text-sm" role="alert">
        {loadError}
      </p>
    );
  }
  if (!subscription) return null;
  const displayTitle = getSubscriptionDisplayTitle(subscription);
  const totalAmount = selectedCount * parseFloat(subscription.amount);
  return (
    <div className="bg-muted/40 flex items-center justify-between gap-4 rounded-lg border px-4 py-3.5">
      <p className="text-xl leading-tight font-semibold">{displayTitle}</p>
      <p className="flex shrink-0 items-baseline gap-2">
        <span className="text-muted-foreground text-sm">Total</span>
        <span className="text-xl font-semibold tabular-nums">{formatAmount(totalAmount)}</span>
      </p>
    </div>
  );
}
