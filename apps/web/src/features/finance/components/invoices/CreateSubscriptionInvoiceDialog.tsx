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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatAmount } from '@/features/finance/constants/finance';
import { getSubscriptionDisplayTitle } from '@/features/finance/utils/subscription-display';
import { formatSubscriptionInvoiceMonthLabel } from '@/features/finance/utils/subscription-invoice-months';
import type { Subscription } from '@/lib/api/subscriptions';
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
            Choose an uncovered coverage month. Amount and due date follow the subscription billing
            rules.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => void state.handleSubmit(event)} className="space-y-4">
          <SubscriptionInvoiceContext
            loading={state.loading}
            loadError={state.loadError}
            subscription={state.subscription}
          />
          <CoverageMonthField
            eligibleMonths={state.eligibleMonths}
            coverageMonth={state.coverageMonth}
            onCoverageMonthChange={state.setCoverageMonth}
            coverageMonthCount={state.subscription?.coverageMonthCount ?? 1}
            disabled={state.loading || state.submitting || !state.subscription}
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

function CoverageMonthField({
  eligibleMonths,
  coverageMonth,
  onCoverageMonthChange,
  coverageMonthCount,
  disabled,
}: {
  eligibleMonths: readonly string[];
  coverageMonth: string;
  onCoverageMonthChange: (value: string) => void;
  coverageMonthCount: number;
  disabled: boolean;
}) {
  if (eligibleMonths.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No uncovered month is available. Only active subscriptions can invoice this month, next
        month, or an unpaid past month.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      <Label htmlFor="subscription-invoice-coverage-month">Coverage month</Label>
      <Select
        value={coverageMonth}
        onValueChange={(value) => {
          if (value) onCoverageMonthChange(value);
        }}
        disabled={disabled}
      >
        <SelectTrigger id="subscription-invoice-coverage-month" className="w-full">
          <SelectValue placeholder="Select month">
            {coverageMonth ? formatSubscriptionInvoiceMonthLabel(coverageMonth) : null}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {eligibleMonths.map((monthKey) => (
            <SelectItem key={monthKey} value={monthKey}>
              {formatSubscriptionInvoiceMonthLabel(monthKey)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <CoverageMonthHint coverageMonthCount={coverageMonthCount} />
    </div>
  );
}

function CoverageMonthHint({ coverageMonthCount }: { coverageMonthCount: number }) {
  if (coverageMonthCount > 1) {
    return (
      <p className="text-muted-foreground text-xs">
        This invoice covers {coverageMonthCount} months starting in the selected month.
      </p>
    );
  }
  return (
    <p className="text-muted-foreground text-xs">
      Due date is the later of billing day and issue day, plus 5 days.
    </p>
  );
}
