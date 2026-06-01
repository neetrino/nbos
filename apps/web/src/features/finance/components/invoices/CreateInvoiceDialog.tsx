'use client';

import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { NbosDatePicker } from '@/components/shared/date-picker';
import { NbosMoneyInput } from '@/components/shared/NbosMoneyInput';
import { Label } from '@/components/ui/label';
import { formatAmount } from '@/features/finance/constants/finance';
import { getOrderDisplayTitle } from '@/features/finance/utils/order-display';
import type { Order } from '@/lib/api/finance';
import type { Subscription } from '@/lib/api/subscriptions';
import { canSubmitCreateInvoice, type CreateInvoiceFormState } from './create-invoice-dialog-utils';
import {
  useCreateInvoiceDialogState,
  type CreateInvoiceDialogOuterProps,
  type CreateInvoiceDialogState,
} from './use-create-invoice-dialog-state';

export type CreateInvoiceDialogProps = CreateInvoiceDialogOuterProps;

export function CreateInvoiceDialog(props: CreateInvoiceDialogProps) {
  const state = useCreateInvoiceDialogState(props);
  const subscriptionBlocked = computeSubscriptionBlocked(props.subscriptionId, state);
  const canSubmit = canSubmitCreateInvoice(state.form) && !state.loading && !subscriptionBlocked;

  const description = dialogDescription(
    props.order,
    props.subscriptionId,
    state.subscriptionDetail,
    props.clientServiceContext,
  );

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[420px]" forceNestedBackdrop={props.forceNestedBackdrop}>
        <DialogHeader>
          <DialogTitle>
            {dialogTitle(props.order, state.subscriptionDetail, props.clientServiceContext)}
          </DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <InvoiceForm
          state={state}
          order={props.order}
          clientServiceContext={props.clientServiceContext}
          canSubmit={canSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}

function dialogTitle(
  order: Order | null | undefined,
  subscriptionDetail: Subscription | null,
  clientServiceContext?: { name: string; projectLabel: string },
) {
  if (order) return 'Create Order Invoice';
  if (subscriptionDetail) return 'Create Subscription Invoice';
  if (clientServiceContext) return 'Create invoice';
  return 'New Invoice';
}

function dialogDescription(
  order: Order | null | undefined,
  subscriptionId: string | null | undefined,
  subscriptionDetail: Subscription | null,
  clientServiceContext?: { name: string; projectLabel: string },
) {
  if (order) return `Generate an invoice for ${getOrderDisplayTitle(order)}.`;
  if (subscriptionDetail) return `Bill against subscription ${subscriptionDetail.code}.`;
  if (subscriptionId) return 'Loading subscription context…';
  if (clientServiceContext) {
    return `Invoice for ${clientServiceContext.name} · ${clientServiceContext.projectLabel}`;
  }
  return null;
}

function computeSubscriptionBlocked(
  subscriptionId: string | null | undefined,
  state: Pick<CreateInvoiceDialogState, 'subscriptionLoading' | 'loadError' | 'subscriptionDetail'>,
) {
  if (!subscriptionId?.trim()) return false;
  return state.subscriptionLoading || state.loadError !== null || !state.subscriptionDetail;
}

function InvoiceForm({
  state,
  order,
  clientServiceContext,
  canSubmit,
}: {
  state: CreateInvoiceDialogState;
  order?: Order | null;
  clientServiceContext?: { name: string; projectLabel: string };
  canSubmit: boolean;
}) {
  const handleSubmit = (event: FormEvent) => {
    void state.handleSubmit(event);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <InvoiceContextSummary
        state={state}
        order={order}
        clientServiceContext={clientServiceContext}
      />
      <InvoiceAmountFields form={state.form} setForm={state.setForm} />
      {state.error ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => state.onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={!canSubmit}>
          {state.loading ? 'Creating...' : 'Create Invoice'}
        </Button>
      </DialogFooter>
    </form>
  );
}

function InvoiceContextSummary({
  state,
  order,
  clientServiceContext,
}: {
  state: CreateInvoiceDialogState;
  order?: Order | null;
  clientServiceContext?: { name: string; projectLabel: string };
}) {
  if (order) {
    return <OrderInvoiceContext order={order} />;
  }

  if (clientServiceContext) {
    return (
      <div className="bg-muted/40 rounded-lg border p-3 text-sm">
        <p className="font-medium">{clientServiceContext.name}</p>
        <p className="text-muted-foreground">{clientServiceContext.projectLabel}</p>
      </div>
    );
  }

  if (state.subscriptionLoading) {
    return (
      <p className="text-muted-foreground text-sm" role="status">
        Loading subscription…
      </p>
    );
  }

  if (state.loadError) {
    return (
      <p className="text-destructive text-sm" role="alert">
        {state.loadError}
      </p>
    );
  }

  if (state.subscriptionDetail) {
    return <SubscriptionInvoiceContext subscription={state.subscriptionDetail} />;
  }

  return null;
}

function OrderInvoiceContext({ order }: { order: Order }) {
  return (
    <div className="bg-muted/40 rounded-lg border p-3 text-sm">
      <p className="font-medium">{getOrderDisplayTitle(order)}</p>
      <p className="text-muted-foreground">
        {order.project.name} · {order.company?.name ?? 'No company'}
      </p>
      <p className="text-muted-foreground mt-1">
        Order total: {formatAmount(Number(order.amount))}
      </p>
    </div>
  );
}

function SubscriptionInvoiceContext({ subscription }: { subscription: Subscription }) {
  return (
    <div className="bg-muted/40 rounded-lg border p-3 text-sm">
      <p className="font-medium">{subscription.code}</p>
      <p className="text-muted-foreground">
        {subscription.project.name}
        {subscription.company?.name ? ` · ${subscription.company.name}` : ''}
      </p>
      <p className="text-muted-foreground mt-1">
        Monthly amount: {formatAmount(parseFloat(subscription.baseMonthlyAmount))}
      </p>
    </div>
  );
}

function InvoiceAmountFields({
  form,
  setForm,
}: {
  form: CreateInvoiceFormState;
  setForm: (form: CreateInvoiceFormState) => void;
}) {
  return (
    <div className="space-y-3">
      <NbosMoneyInput
        label="Amount *"
        value={form.amount}
        onChange={(amount) => setForm({ ...form, amount })}
        autoFocus
      />
      <div>
        <Label>Due date</Label>
        <NbosDatePicker
          value={form.dueDate}
          onChange={(dueDate) => setForm({ ...form, dueDate })}
          variant="extended"
          aria-label="Due date"
        />
        <p className="text-muted-foreground mt-1 text-xs">
          Defaults to 10 days from creation when left empty.
        </p>
      </div>
    </div>
  );
}
