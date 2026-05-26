import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { resolveCreateInvoiceType, resolveInvoiceDueDate } from './invoice-create-resolver';

describe('invoice-create-resolver', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-26T15:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('defaults due date to +10 days from today when omitted', () => {
    const due = resolveInvoiceDueDate();
    expect(due.getFullYear()).toBe(2026);
    expect(due.getMonth()).toBe(5);
    expect(due.getDate()).toBe(5);
  });

  it('uses explicit due date when provided', () => {
    const due = resolveInvoiceDueDate('2026-06-01T00:00:00.000Z');
    expect(due.toISOString()).toBe('2026-06-01T00:00:00.000Z');
  });

  it('resolves MANUAL when no source is linked', async () => {
    const prisma = { order: { findUnique: vi.fn() } } as never;
    await expect(resolveCreateInvoiceType(prisma, {})).resolves.toBe('MANUAL');
  });

  it('resolves SUBSCRIPTION from subscriptionId', async () => {
    const prisma = {} as never;
    await expect(resolveCreateInvoiceType(prisma, { subscriptionId: 'sub-1' })).resolves.toBe(
      'SUBSCRIPTION',
    );
  });

  it('maps extension orders to EXTENSION invoice type', async () => {
    const prisma = {
      order: {
        findUnique: vi.fn().mockResolvedValue({ type: 'EXTENSION', paymentType: 'CLASSIC' }),
      },
    } as never;
    await expect(resolveCreateInvoiceType(prisma, { orderId: 'ord-1' })).resolves.toBe('EXTENSION');
  });
});
