import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Job } from 'bullmq';
import { WhatsAppOutboundMessagesWorker } from './whatsapp-outbound-messages.worker';
import type { WhatsAppOutboundJobPayload } from './whatsapp-outbound.types';

const sendTextMessage = vi.fn();
const requireClientConfig = vi.fn();
const dispatchWhatsAppCoreSendJob = vi.fn();
const waitWhatsAppOutboundGap = vi.fn();

vi.mock('./whatsapp-outbound-gap', () => ({
  waitWhatsAppOutboundGap: (...args: unknown[]) => waitWhatsAppOutboundGap(...args),
}));

vi.mock('../../messenger/core/messenger-wa-outbound-dispatch.ops', () => ({
  dispatchWhatsAppCoreSendJob: (...args: unknown[]) => dispatchWhatsAppCoreSendJob(...args),
  markWhatsAppCoreSendExhausted: vi.fn(),
}));

vi.mock('../../messenger/core/messenger-wa-outbound-drain.ops', () => ({
  drainPendingWhatsAppCoreSends: vi.fn(),
}));

vi.mock('../../finance/invoices/invoice-official-request', () => ({
  sendOfficialInvoiceRequest: vi.fn(),
  cancelOfficialInvoiceRequest: vi.fn(),
}));

vi.mock('../../finance/invoices/invoice-card-payment-window-reminders', () => ({
  tryEnqueueSubscriptionPaymentWindowForInvoice: vi.fn(),
}));

describe('WhatsAppOutboundMessagesWorker leftover finance kinds', () => {
  beforeEach(() => {
    sendTextMessage.mockReset().mockResolvedValue(undefined);
    requireClientConfig.mockReset().mockResolvedValue({ session: 's1' });
    dispatchWhatsAppCoreSendJob.mockReset().mockResolvedValue(undefined);
    waitWhatsAppOutboundGap.mockReset().mockResolvedValue(undefined);
  });

  it.each(['payment_reminder', 'overdue_reminder'] as const)(
    'does not Gateway-send stale %s jobs',
    async (kind) => {
      const worker = createWorker();
      await worker.process(financeJob(kind));
      expect(sendTextMessage).not.toHaveBeenCalled();
      expect(requireClientConfig).not.toHaveBeenCalled();
      expect(dispatchWhatsAppCoreSendJob).not.toHaveBeenCalled();
    },
  );

  it('still Gateway-sends official_send', async () => {
    const worker = createWorker();
    await worker.process(financeJob('official_send'));
    expect(requireClientConfig).toHaveBeenCalledTimes(1);
    expect(sendTextMessage).toHaveBeenCalledTimes(1);
  });

  it('dispatches core_client_send through Core, not sendTextMessage', async () => {
    const worker = createWorker();
    await worker.process({
      id: 'job-core',
      data: {
        kind: 'core_client_send',
        chatId: 'x@g.us',
        accountId: 'acc-1',
        messageId: 'msg-1',
        conversationId: 'conv-1',
        idempotencyKey: 'core-1',
      },
    } as Job<WhatsAppOutboundJobPayload>);
    expect(dispatchWhatsAppCoreSendJob).toHaveBeenCalledTimes(1);
    expect(sendTextMessage).not.toHaveBeenCalled();
  });
});

function createWorker(): WhatsAppOutboundMessagesWorker {
  return new WhatsAppOutboundMessagesWorker(
    {} as never,
    { requireClientConfig } as never,
    { sendTextMessage } as never,
    { register: vi.fn() } as never,
  );
}

function financeJob(
  kind: 'payment_reminder' | 'overdue_reminder' | 'official_send',
): Job<WhatsAppOutboundJobPayload> {
  return {
    id: `job-${kind}`,
    data: {
      kind,
      chatId: 'x@g.us',
      text: 'hello',
      idempotencyKey: `idemp-${kind}`,
      invoiceId: 'inv-1',
    },
  } as Job<WhatsAppOutboundJobPayload>;
}
