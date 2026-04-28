'use client';

import { useEffect, useState } from 'react';
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
import { ApiError } from '@/lib/api-errors';
import { invoicesApi, type Order } from '@/lib/api/finance';
import { projectsApi, type Project } from '@/lib/api/projects';
import {
  buildCreateInvoicePayload,
  canSubmitCreateInvoice,
  getInitialInvoiceForm,
  type CreateInvoiceFormState,
} from './create-invoice-dialog-utils';

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => Promise<void> | void;
  order?: Order | null;
}

export function CreateInvoiceDialog(props: CreateInvoiceDialogProps) {
  const state = useCreateInvoiceDialogState(props);
  const canSubmit = canSubmitCreateInvoice(state.form) && !state.loading;

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{props.order ? 'Create Order Invoice' : 'New Invoice'}</DialogTitle>
          <DialogDescription>
            {props.order
              ? `Generate an invoice for ${props.order.code}.`
              : 'Create a manual invoice.'}
          </DialogDescription>
        </DialogHeader>
        <InvoiceForm state={state} order={props.order} canSubmit={canSubmit} />
      </DialogContent>
    </Dialog>
  );
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
  return (
    <form onSubmit={state.handleSubmit} className="space-y-4">
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

interface CreateInvoiceDialogState {
  form: CreateInvoiceFormState;
  setForm: (form: CreateInvoiceFormState) => void;
  projects: Project[];
  loading: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  handleSubmit: (event: FormEvent) => Promise<void>;
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

function useCreateInvoiceDialogState({
  open,
  onOpenChange,
  onCreated,
  order,
}: CreateInvoiceDialogProps): CreateInvoiceDialogState {
  const [form, setForm] = useState(() => getInitialInvoiceForm(order));
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(getInitialInvoiceForm(order));
    setError(null);
    if (!order) void loadProjects(setProjects, setError);
  }, [open, order]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmitCreateInvoice(form)) return;
    setLoading(true);
    try {
      await invoicesApi.create(buildCreateInvoicePayload(form, order));
      await onCreated();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Invoice could not be created.');
    } finally {
      setLoading(false);
    }
  };

  return { form, setForm, projects, loading, error, onOpenChange, handleSubmit };
}

async function loadProjects(
  setProjects: (projects: Project[]) => void,
  setError: (error: string | null) => void,
) {
  try {
    const data = await projectsApi.getAll({ pageSize: 100 });
    setProjects(data.items);
  } catch {
    setError('Projects could not be loaded.');
  }
}
