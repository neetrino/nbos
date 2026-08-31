import type { WhatsAppOutboundKind } from './whatsapp-outbound.types';

export type WhatsAppOutboundEnqueueAction = 'add' | 'skip' | 'wait' | 'remove_then_add';

/**
 * Core client send may replace a completed/failed BullMQ job so the same
 * Idempotency-Key can recover a missing provider ref. Finance kinds still
 * no-op when the job already completed.
 */
export function nextWhatsAppOutboundEnqueueAction(
  kind: WhatsAppOutboundKind,
  existingState: string | null,
  wait: boolean,
): WhatsAppOutboundEnqueueAction {
  if (!existingState) return 'add';
  if (existingState === 'failed') return 'remove_then_add';
  if (existingState === 'completed') {
    return kind === 'core_client_send' ? 'remove_then_add' : 'skip';
  }
  if (wait) return 'wait';
  return 'skip';
}

export async function removeWhatsAppOutboundJobForReplace(
  existing: { remove: () => Promise<unknown> } | null,
  action: WhatsAppOutboundEnqueueAction,
): Promise<void> {
  if (action !== 'remove_then_add' || !existing) return;
  await existing.remove();
}
