import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX } from '../../integrations/whatsapp-gateway/whatsapp-gateway.constants';
import {
  offerWhatsAppCoreSendJob,
  whatsAppCoreSendJobFromMessage,
} from './messenger-wa-outbound.ops';
import {
  SCHEDULER_JOB_CATALOG,
  SCHEDULER_ROSTER_INTENT,
} from '../../scheduler/scheduler-job-catalog';
import { SCHEDULER_JOB_NAMES } from '../../scheduler/scheduler-lease.constants';
import { resolveSeedEnabled } from '../../scheduler/scheduler-job-policy.service';
import { MESSENGER_OUTBOUND_RECONCILE_ENABLED_ENV } from './messenger-outbound-reconcile.constants';

const JOB = {
  kind: 'core_client_send' as const,
  chatId: '37499111222@c.us',
  accountId: 'acc_a',
  messageId: 'msg-1',
  conversationId: 'conv-c',
  idempotencyKey: `${WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX}msg-1`,
};

describe('Phase 6 outbound queue observability', () => {
  it('queue payload is identity-only and excludes credentials or message body', () => {
    const payload = whatsAppCoreSendJobFromMessage(
      { id: JOB.messageId, conversationId: JOB.conversationId },
      { externalAccountId: JOB.accountId, externalConversationId: JOB.chatId },
    );
    expect(payload).toEqual(JOB);
    expect(Object.keys(payload).sort()).toEqual([
      'accountId',
      'chatId',
      'conversationId',
      'idempotencyKey',
      'kind',
      'messageId',
    ]);
    const json = JSON.stringify(payload);
    expect(json).not.toMatch(/token|secret|password|authorization|text|content|preview/i);
    expect(Buffer.byteLength(json, 'utf8')).toBeGreaterThan(0);
    expect(Buffer.byteLength(json, 'utf8')).toBeLessThan(512);
  });

  it('Redis enqueue failure after DB success leaves HTTP unblocked', async () => {
    const enqueue = vi.fn().mockRejectedValue(new Error('redis down'));
    const queue = { isAvailable: () => true, enqueue };
    await expect(offerWhatsAppCoreSendJob(queue as never, JOB)).resolves.toBeUndefined();
    expect(enqueue).toHaveBeenCalledTimes(1);
  });

  it('HTTP enqueue offer does not invoke a worker process method', async () => {
    const enqueue = vi.fn().mockResolvedValue(undefined);
    const process = vi.fn();
    await offerWhatsAppCoreSendJob({ isAvailable: () => true, enqueue, process } as never, JOB);
    expect(enqueue).toHaveBeenCalledTimes(1);
    expect(process).not.toHaveBeenCalled();
  });

  it('outbound reconcile scheduler remains roster-off by default', () => {
    const entry = SCHEDULER_JOB_CATALOG.find(
      (row) => row.jobName === SCHEDULER_JOB_NAMES.messengerOutboundReconcile,
    );
    expect(entry?.enabledEnvKey).toBe(MESSENGER_OUTBOUND_RECONCILE_ENABLED_ENV);
    expect(entry?.rosterIntent).toBe(SCHEDULER_ROSTER_INTENT.off);
    expect(resolveSeedEnabled(entry!, {})).toBe(false);
    expect(resolveSeedEnabled(entry!, { [MESSENGER_OUTBOUND_RECONCILE_ENABLED_ENV]: 'true' })).toBe(
      true,
    );
  });

  it('worker job logs duration without messageId metric labels', () => {
    const source = readFileSync(
      new URL(
        '../../integrations/whatsapp-gateway/whatsapp-outbound-messages.worker.ts',
        import.meta.url,
      ),
      'utf8',
    );
    expect(source).toMatch(/durationMs: Date\.now\(\) - started/);
    expect(source).toMatch(/logBullmqJob\(/);
    expect(source).not.toMatch(/logBullmqJob\([\s\S]{0,400}messageId:/);
  });
});
