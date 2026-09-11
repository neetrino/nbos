import { describe, expect, it, vi } from 'vitest';
import {
  nextWhatsAppOutboundEnqueueAction,
  removeWhatsAppOutboundJobForReplace,
} from './whatsapp-outbound-enqueue.ops';

describe('WhatsApp outbound enqueue replace (FINDING-S8-10)', () => {
  it('removes then re-adds a completed core_client_send job', () => {
    expect(nextWhatsAppOutboundEnqueueAction('core_client_send', 'completed', false)).toBe(
      'remove_then_add',
    );
    expect(nextWhatsAppOutboundEnqueueAction('core_client_send', 'completed', true)).toBe(
      'remove_then_add',
    );
  });

  it('removes then re-adds a failed core_client_send job', () => {
    expect(nextWhatsAppOutboundEnqueueAction('core_client_send', 'failed', false)).toBe(
      'remove_then_add',
    );
  });

  it('no-ops a completed non-core (finance/official) job', () => {
    expect(nextWhatsAppOutboundEnqueueAction('official_send', 'completed', false)).toBe('skip');
    expect(nextWhatsAppOutboundEnqueueAction('official_send', 'completed', true)).toBe('skip');
    expect(nextWhatsAppOutboundEnqueueAction('payment_reminder', 'completed', false)).toBe('skip');
    expect(nextWhatsAppOutboundEnqueueAction('overdue_reminder', 'completed', false)).toBe('skip');
    expect(nextWhatsAppOutboundEnqueueAction('client_invite', 'completed', false)).toBe('skip');
    expect(nextWhatsAppOutboundEnqueueAction('official_cancel', 'completed', false)).toBe('skip');
  });

  it('still replaces failed finance jobs so retries are not stuck', () => {
    expect(nextWhatsAppOutboundEnqueueAction('official_send', 'failed', false)).toBe(
      'remove_then_add',
    );
  });

  it('adds when no existing job is present', () => {
    expect(nextWhatsAppOutboundEnqueueAction('core_client_send', null, false)).toBe('add');
    expect(nextWhatsAppOutboundEnqueueAction('official_send', null, true)).toBe('add');
  });
});

describe('WhatsApp outbound enqueue remove-then-add (FINDING-S8-10)', () => {
  it('removes a completed core job before add; skips completed finance', async () => {
    const coreJob = { remove: vi.fn().mockResolvedValue(undefined) };
    const financeJob = { remove: vi.fn().mockResolvedValue(undefined) };
    const coreAction = nextWhatsAppOutboundEnqueueAction('core_client_send', 'completed', false);
    const financeAction = nextWhatsAppOutboundEnqueueAction('official_send', 'completed', false);
    await removeWhatsAppOutboundJobForReplace(coreJob, coreAction);
    await removeWhatsAppOutboundJobForReplace(financeJob, financeAction);
    expect(coreAction).toBe('remove_then_add');
    expect(financeAction).toBe('skip');
    expect(coreJob.remove).toHaveBeenCalledTimes(1);
    expect(financeJob.remove).not.toHaveBeenCalled();
  });
});
