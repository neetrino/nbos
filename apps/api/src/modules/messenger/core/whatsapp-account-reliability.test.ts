import { describe, expect, it } from 'vitest';
import { decideWhatsAppReconcileDelivery } from './messenger-outbound-reconcile-delivery';
import { planLegacyDefaultMapping } from './legacy-whatsapp-default-account.ops';

const NOW = new Date('2026-10-07T07:00:00.000Z');

describe('WhatsApp delivery decisions', () => {
  it('does not enqueue a message that is already sent', () => {
    expect(
      decideWhatsAppReconcileDelivery({
        messageStatus: 'SENT',
        commandStatus: 'PENDING',
        firstAttemptAt: NOW,
        now: NOW,
      }),
    ).toBe('skip_delivered');
  });

  it('does not resend a fresh SENDING row', () => {
    expect(
      decideWhatsAppReconcileDelivery({
        messageStatus: 'SENDING',
        commandStatus: 'PENDING',
        firstAttemptAt: NOW,
        now: new Date(NOW.getTime() + 5_000),
        staleAfterMs: 60_000,
      }),
    ).toBe('wait');
  });

  it('marks a stale SENDING row unknown before any retry', () => {
    expect(
      decideWhatsAppReconcileDelivery({
        messageStatus: 'SENDING',
        commandStatus: 'PENDING',
        firstAttemptAt: new Date(NOW.getTime() - 120_000),
        now: NOW,
        staleAfterMs: 60_000,
      }),
    ).toBe('mark_unknown');
  });

  it('allows a same-key retry only after the outcome is unknown', () => {
    expect(
      decideWhatsAppReconcileDelivery({
        messageStatus: 'SENDING',
        commandStatus: 'OUTCOME_UNKNOWN',
        firstAttemptAt: new Date(NOW.getTime() - 120_000),
        now: NOW,
        staleAfterMs: 60_000,
      }),
    ).toBe('enqueue');
  });
});

describe('legacy default WhatsApp mappings', () => {
  const row = { id: 'map-1', conversationId: 'conv-1', externalConversationId: '120@g.us' };

  it('migrates a default mapping when the target chat is free', () => {
    expect(planLegacyDefaultMapping({ row, conflictConversationId: null }).action).toBe('migrate');
  });

  it('does not rewrite a chat that already belongs to another conversation', () => {
    expect(planLegacyDefaultMapping({ row, conflictConversationId: 'conv-2' })).toEqual(
      expect.objectContaining({ action: 'manual_review' }),
    );
  });
});
