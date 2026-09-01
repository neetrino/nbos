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
      <DialogContent className="sm:max-w-[420px]" forceNestedBackdrop={props.forceNestedBackdrop}>
        <DialogHeader>
          <DialogTitle>Create Subscription Invoice</DialogTitle>
          <DialogDescription>
            Choose one or more uncovered coverage months. Each month becomes a separate invoice.
            Amount and due date follow the subscription billing rules.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => void state.handleSubmit(event)} className="space-y-4">
          <SubscriptionInvoiceContext
            loading={state.loading}
            loadError={state.loadError}
            subscription={state.subscription}
          />
          <CoverageMonthChecklist
            eligibleMonths={state.eligibleMonths}
            coverageMonths={state.coverageMonths}
            coverageMonthCount={state.subscription?.coverageMonthCount ?? 1}
            periodAmount={state.subscription ? parseFloat(state.subscription.amount) : 0}
            canAddMonth={state.canAddMonth}
            disabled={state.loading || state.submitting || !state.subscription}
            onToggle={state.toggleCoverageMonth}
          />
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
              {submitLabel(state.submitting, state.coverageMonths.length)}
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
}: {
  loading: boolean;
  loadError: string | null;
  subscription: Subscription | null;
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
  return (
    <div className="bg-muted/40 rounded-lg border p-3 text-sm">
      <p className="font-medium">{displayTitle}</p>
      {displayTitle !== subscription.code ? (
        <p className="text-muted-foreground text-xs">{subscription.code}</p>
      ) : null}
      <p className="text-muted-foreground">
        {subscription.project.name}
        {subscription.company?.name ? ` · ${subscription.company.name}` : ''}
      </p>
      <p className="text-muted-foreground mt-1">
        Period amount: {formatAmount(parseFloat(subscription.amount))}
      </p>
    </div>
  );
}

function submitLabel(submitting: boolean, selectedCount: number): string {
  if (submitting) return 'Creating...';
  if (selectedCount > 1) return `Create ${selectedCount} Invoices`;
  return 'Create Invoice';
}
