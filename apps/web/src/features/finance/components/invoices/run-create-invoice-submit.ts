import type { FormEvent } from 'react';
import { ApiError } from '@/lib/api-errors';
import { invoicesApi, type Order } from '@/lib/api/finance';
import type { Subscription } from '@/lib/api/subscriptions';
import {
  buildCreateInvoicePayload,
  canSubmitCreateInvoice,
  type CreateInvoiceFormState,
} from './create-invoice-dialog-utils';

export async function runCreateInvoiceSubmit(
  event: FormEvent,
  params: {
    form: CreateInvoiceFormState;
    order?: Order | null;
    subscriptionDetail: Subscription | null;
    setLoading: (v: boolean) => void;
    setError: (e: string | null) => void;
    onCreated: () => Promise<void> | void;
    onOpenChange: (open: boolean) => void;
  },
): Promise<void> {
  event.preventDefault();
  if (!canSubmitCreateInvoice(params.form)) return;
  params.setLoading(true);
  try {
    await invoicesApi.create(
      buildCreateInvoicePayload(params.form, params.order, params.subscriptionDetail),
    );
    await params.onCreated();
    params.onOpenChange(false);
  } catch (err) {
    params.setError(err instanceof ApiError ? err.message : 'Invoice could not be created.');
  } finally {
    params.setLoading(false);
  }
}
