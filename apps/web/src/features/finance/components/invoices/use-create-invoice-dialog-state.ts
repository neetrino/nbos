import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { Invoice, Order } from '@/lib/api/finance';
import type { Subscription } from '@/lib/api/subscriptions';
import { getInitialInvoiceForm, type CreateInvoiceFormState } from './create-invoice-dialog-utils';
import type { CreateInvoiceHiddenContext } from './create-invoice-dialog-utils';
import { bootstrapCreateInvoiceDialog } from './create-invoice-dialog-bootstrap';
import { runCreateInvoiceSubmit } from './run-create-invoice-submit';

export interface CreateInvoiceDialogOuterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (invoice?: Invoice) => Promise<void> | void;
  order?: Order | null;
  subscriptionId?: string | null;
  /** Optional hidden context for non-manual entry points (not shown in popup). */
  hiddenContext?: CreateInvoiceHiddenContext;
  /** Custom submit (e.g. deal deposit bootstrap) instead of default invoices API create. */
  submitOverride?: (form: CreateInvoiceFormState) => Promise<Invoice | void>;
  /** Pre-filled amount/due date when opening from a client service sheet. */
  defaultForm?: CreateInvoiceFormState;
  /** Read-only context shown in the dialog header area. */
  clientServiceContext?: { name: string; projectLabel: string };
  /** Dimmed backdrop when opened inside a parent sheet/dialog (e.g. Deal card). */
  forceNestedBackdrop?: boolean;
}

export interface CreateInvoiceDialogState {
  form: CreateInvoiceFormState;
  setForm: (form: CreateInvoiceFormState) => void;
  loading: boolean;
  error: string | null;
  loadError: string | null;
  subscriptionDetail: Subscription | null;
  subscriptionLoading: boolean;
  onOpenChange: (open: boolean) => void;
  handleSubmit: (event: FormEvent) => Promise<void>;
}

export function useCreateInvoiceDialogState({
  open,
  onOpenChange,
  onCreated,
  order,
  subscriptionId,
  hiddenContext,
  submitOverride,
  defaultForm,
}: CreateInvoiceDialogOuterProps): CreateInvoiceDialogState {
  const [form, setForm] = useState(() => getInitialInvoiceForm(order));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [subscriptionDetail, setSubscriptionDetail] = useState<Subscription | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  const hiddenContextKey = JSON.stringify(hiddenContext ?? {});
  const defaultFormKey = JSON.stringify(defaultForm ?? {});

  useEffect(() => {
    bootstrapCreateInvoiceDialog({
      open,
      order,
      subscriptionId,
      hiddenContext,
      defaultForm,
      setError,
      setLoadError,
      setForm,
      setSubscriptionDetail,
      setSubscriptionLoading,
    });
  }, [open, order, subscriptionId, hiddenContextKey, hiddenContext, defaultFormKey, defaultForm]);

  const handleSubmit = (event: FormEvent) =>
    runCreateInvoiceSubmit(event, {
      form,
      order,
      subscriptionDetail,
      hiddenContext,
      submitOverride,
      setLoading,
      setError,
      onCreated,
      onOpenChange,
    });

  return {
    form,
    setForm,
    loading,
    error,
    loadError,
    subscriptionDetail,
    subscriptionLoading,
    onOpenChange,
    handleSubmit,
  };
}
