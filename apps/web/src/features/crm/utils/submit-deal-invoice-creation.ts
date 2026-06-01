import { dealsApi } from '@/lib/api/deals';
import { invoicesApi } from '@/lib/api/finance';
import {
  buildCreateInvoicePayload,
  type CreateInvoiceFormState,
} from '@/features/finance/components/invoices/create-invoice-dialog-utils';
import type { Order } from '@/lib/api/finance';

export async function submitDealInvoiceCreation(
  dealId: string,
  form: CreateInvoiceFormState,
  order: Order | null,
): Promise<void> {
  if (order) {
    await invoicesApi.create(buildCreateInvoicePayload(form, order));
    return;
  }

  await dealsApi.createDepositOrder(dealId, {
    amount: Number(form.amount),
    dueDate: form.dueDate.trim() || null,
  });
}
