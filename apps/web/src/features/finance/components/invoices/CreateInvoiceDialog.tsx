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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { INVOICE_TYPES, formatAmount } from '@/features/finance/constants/finance';
import type { Order } from '@/lib/api/finance';
import type { Subscription } from '@/lib/api/subscriptions';
import { canSubmitCreateInvoice, type CreateInvoiceFormState } from './create-invoice-dialog-utils';
import {
  useCreateInvoiceDialogState,
  type CreateInvoiceDialogState,
} from './use-create-invoice-dialog-state';

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => Promise<void> | void;
  order?: Order | null;
  subscriptionId?: string | null;
}

export function CreateInvoiceDialog(props: CreateInvoiceDialogProps) {
  const state = useCreateInvoiceDialogState(props);
  const subscriptionBlocked = computeSubscriptionBlocked(props.subscriptionId, state);
  const canSubmit = canSubmitCreateInvoice(state.form) && !state.loading && !subscriptionBlocked;

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle(props.order, state.subscriptionDetail)}</DialogTitle>
          <DialogDescription>
            {dialogDescription(props.order, props.subscriptionId, state.subscriptionDetail)}
          </DialogDescription>
        </DialogHeader>
        <InvoiceForm state={state} order={props.order} canSubmit={canSubmit} />
      </DialogContent>
    </Dialog>
  );
}

function dialogTitle(order: Order | null | undefined, subscriptionDetail: Subscription | null) {
  if (order) return 'Create Order Invoice';
  if (subscriptionDetail) return 'Create Subscription Invoice';
  return 'New Invoice';
}

function dialogDescription(
  order: Order | null | undefined,
  subscriptionId: string | null | undefined,
  subscriptionDetail: Subscription | null,
) {
  if (order) return `Generate an invoice for ${order.code}.`;
  if (subscriptionDetail) return `Bill against subscription ${subscriptionDetail.code}.`;
  if (subscriptionId) return 'Loading subscription context…';
  return 'Create a manual invoice.';
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
  canSubmit,
}: {
  state: CreateInvoiceDialogState;
  order?: Order | null;
  canSubmit: boolean;
}) {
  const handleSubmit = (event: FormEvent) => {
    void state.handleSubmit(event);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <InvoiceContextFields state={state} order={order} />
      <InvoiceAmountFields form={state.form} setForm={state.setForm} />
      {state.error && <p className="text-destructive text-sm">{state.error}</p>}
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

function InvoiceContextFields({
  state,
  order,
}: {
  state: CreateInvoiceDialogState;
  order?: Order | null;
}) {
  if (order) {
    return <OrderInvoiceContext order={order} />;
  }

  if (state.subscriptionLoading) {
    return (
      <p className="text-muted-foreground text-sm" role="status">
        Loading subscription…
      </p>
    );
  }

  if (state.loadError) {
    return <p className="text-destructive text-sm">{state.loadError}</p>;
  }

  if (state.subscriptionDetail) {
    return <SubscriptionInvoiceContext subscription={state.subscriptionDetail} />;
  }

  return (
    <div>
      <Label>Project *</Label>
      <Select
        value={state.form.projectId || undefined}
        onValueChange={(value) => state.setForm({ ...state.form, projectId: value ?? '' })}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select project" />
        </SelectTrigger>
        <SelectContent>
          {state.projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.code} · {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function OrderInvoiceContext({ order }: { order: Order }) {
  return (
    <div className="bg-muted/40 rounded-lg border p-3 text-sm">
      <p className="font-medium">{order.code}</p>
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
        Monthly amount: {formatAmount(parseFloat(subscription.amount))}
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
    <div className="grid grid-cols-2 gap-3">
      <div>
        <Label>Amount *</Label>
        <Input
          type="number"
          min="0"
          step="1"
          value={form.amount}
          onChange={(event) => setForm({ ...form, amount: event.target.value })}
        />
      </div>
      <div>
        <Label>Due Date</Label>
        <Input
          type="date"
          value={form.dueDate}
          onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
        />
      </div>
      <div className="col-span-2">
        <Label>Type *</Label>
        <Select
          value={form.type || undefined}
          onValueChange={(value) => setForm({ ...form, type: value ?? '' })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {INVOICE_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
