import type { FormEvent } from 'react';
import { getApiErrorMessage } from '@/lib/api-errors';
import { invoicesApi, type Invoice, type Order } from '@/lib/api/finance';
import type { Subscription } from '@/lib/api/subscriptions';
import {
  buildCreateInvoicePayload,
  canSubmitCreateInvoice,
  type CreateInvoiceFormState,
  type CreateInvoiceHiddenContext,
} from './create-invoice-dialog-utils';

export async function runCreateInvoiceSubmit(
  event: FormEvent,
  params: {
    form: CreateInvoiceFormState;
    order?: Order | null;
    subscriptionDetail: Subscription | null;
    hiddenContext?: CreateInvoiceHiddenContext;
    submitOverride?: (form: CreateInvoiceFormState) => Promise<Invoice | void>;
    setLoading: (v: boolean) => void;
    setError: (e: string | null) => void;
    onCreated: (invoice?: Invoice) => Promise<void> | void;
    onOpenChange: (open: boolean) => void;
  },
): Promise<void> {
  event.preventDefault();
  if (!canSubmitCreateInvoice(params.form)) return;
  params.setLoading(true);
  try {
    if (params.submitOverride) {
      const created = await params.submitOverride(params.form);
      await params.onCreated(created);
    } else {
      const created = await invoicesApi.create(
        buildCreateInvoicePayload(
          params.form,
          params.order,
          params.subscriptionDetail,
          params.hiddenContext,
        ),
      );
      await params.onCreated(created);
    }
    params.onOpenChange(false);
  } catch (err) {
    params.setError(getApiErrorMessage(err, 'Invoice could not be created.'));
  } finally {
    params.setLoading(false);
  }
}
