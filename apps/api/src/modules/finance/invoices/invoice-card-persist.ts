import type { Prisma } from '@nbos/database';

const AWAITING_PAYMENT = 'AWAITING_PAYMENT';

export type OfficialAwaitingNotifyOptions = {
  wait?: boolean;
};

export type OfficialAwaitingNotifier = {
  enqueueIfAwaitingEligible(
    invoiceId: string,
    options?: OfficialAwaitingNotifyOptions,
  ): Promise<void>;
};

/**
 * After any invoice write. Origin does not matter.
 * Safe no-op unless the card is in Awaiting Payment (Tax gate lives in the notifier).
 */
export async function notifyOfficialAfterInvoiceWrite(
  notifier: OfficialAwaitingNotifier | undefined,
  invoice: { id: string; moneyStatus?: string | null },
  options?: OfficialAwaitingNotifyOptions,
): Promise<void> {
  if (!notifier) return;
  if (invoice.moneyStatus != null && invoice.moneyStatus !== AWAITING_PAYMENT) return;
  if (options?.wait) {
    await notifier.enqueueIfAwaitingEligible(invoice.id, options);
    return;
  }
  await notifier.enqueueIfAwaitingEligible(invoice.id);
}

export async function persistInvoiceCreate<T extends { id: string; moneyStatus?: string }>(
  prisma: {
    invoice: {
      create: (args: { data: Prisma.InvoiceUncheckedCreateInput }) => Promise<T>;
    };
  },
  data: Prisma.InvoiceUncheckedCreateInput,
  notifier?: OfficialAwaitingNotifier,
): Promise<T> {
  const invoice = await prisma.invoice.create({ data });
  await notifyOfficialAfterInvoiceWrite(notifier, invoice);
  return invoice;
}
