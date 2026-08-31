import { describe, expect, it, vi } from 'vitest';
import { notifyOfficialAfterInvoiceWrite, persistInvoiceCreate } from './invoice-card-persist';

describe('notifyOfficialAfterInvoiceWrite', () => {
  it('skips when notifier is missing or status is not Awaiting', async () => {
    const notifier = { enqueueIfAwaitingEligible: vi.fn() };
    await notifyOfficialAfterInvoiceWrite(undefined, { id: 'inv-1' });
    await notifyOfficialAfterInvoiceWrite(notifier, { id: 'inv-1', moneyStatus: 'NEW' });
    expect(notifier.enqueueIfAwaitingEligible).not.toHaveBeenCalled();
  });

  it('enqueues when status is Awaiting or omitted', async () => {
    const notifier = { enqueueIfAwaitingEligible: vi.fn().mockResolvedValue(undefined) };
    await notifyOfficialAfterInvoiceWrite(notifier, {
      id: 'inv-1',
      moneyStatus: 'AWAITING_PAYMENT',
    });
    await notifyOfficialAfterInvoiceWrite(notifier, { id: 'inv-2' });
    expect(notifier.enqueueIfAwaitingEligible).toHaveBeenCalledWith('inv-1');
    expect(notifier.enqueueIfAwaitingEligible).toHaveBeenCalledWith('inv-2');
  });
});

describe('persistInvoiceCreate', () => {
  it('creates then notifies from the persisted row', async () => {
    const notifier = { enqueueIfAwaitingEligible: vi.fn().mockResolvedValue(undefined) };
    const prisma = {
      invoice: {
        create: vi.fn().mockResolvedValue({ id: 'inv-1', moneyStatus: 'AWAITING_PAYMENT' }),
      },
    };

    const created = await persistInvoiceCreate(
      prisma,
      { amount: 1000, taxStatus: 'TAX', type: 'SUBSCRIPTION' },
      notifier,
    );

    expect(created.id).toBe('inv-1');
    expect(prisma.invoice.create).toHaveBeenCalled();
    expect(notifier.enqueueIfAwaitingEligible).toHaveBeenCalledWith('inv-1');
  });
});
