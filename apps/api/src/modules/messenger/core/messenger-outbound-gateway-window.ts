import { WHATSAPP_GATEWAY_IDEMPOTENCY_TTL_MS } from '../../integrations/whatsapp-gateway/whatsapp-gateway.constants';

/**
 * Same-key Gateway recovery window. Never-attempted QUEUED (firstAttemptAt null)
 * is not bounded by createdAt. Legacy UNKNOWN/SENDING with null firstAttemptAt
 * infer createdAt once — never completedAt.
 */
export function isNeverAttemptedQueuedSend(
  firstAttemptAt: Date | null,
  messageStatus: string,
): boolean {
  return firstAttemptAt == null && messageStatus === 'QUEUED';
}

export function resolveWhatsAppGatewayWindowStart(command: {
  firstAttemptAt: Date | null;
  createdAt: Date;
}): Date {
  return command.firstAttemptAt ?? command.createdAt;
}

export function isWithinWhatsAppSameKeyWindow(
  command: { firstAttemptAt: Date | null; createdAt: Date },
  now: Date,
): boolean {
  const start = resolveWhatsAppGatewayWindowStart(command);
  return now.getTime() - start.getTime() <= WHATSAPP_GATEWAY_IDEMPOTENCY_TTL_MS;
}
