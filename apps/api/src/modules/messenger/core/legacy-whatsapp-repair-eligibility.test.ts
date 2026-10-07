import { describe, expect, it } from 'vitest';
import { WHATSAPP_ERROR } from '../../integrations/whatsapp-gateway/whatsapp-gateway.constants';
import {
  classifyLegacyRepairFailure,
  isSafeForExplicitLegacyResend,
  whatsAppTransportIdempotencyKey,
} from './legacy-whatsapp-repair-eligibility';
import { MESSENGER_COMMAND_INVALID_REASON } from './messenger-outbound-reconcile.constants';
import { whatsAppOutboundIdempotencyKey } from './messenger-wa-identity';

const NOW = new Date('2026-10-07T12:00:00.000Z');
const THREE_DAYS = new Date(NOW.getTime() - 3 * 24 * 60 * 60 * 1000);

function failed(errorCode: string | null, invalidReason: string | null = null) {
  return {
    status: 'FAILED',
    errorCode,
    invalidReason,
    firstAttemptAt: THREE_DAYS,
    createdAt: THREE_DAYS,
  };
}

describe('explicit legacy resend allowlist', () => {
  it.each([
    WHATSAPP_ERROR.NOT_CONNECTED,
    WHATSAPP_ERROR.GATEWAY_NOT_CONFIGURED,
    MESSENGER_COMMAND_INVALID_REASON.FORGED_ROUTING,
  ])('allows proven pre-provider code %s', (errorCode) => {
    const command = failed(errorCode, errorCode === 'FORGED_ROUTING' ? errorCode : null);
    expect(isSafeForExplicitLegacyResend(command)).toBe(true);
    expect(classifyLegacyRepairFailure(command, NOW)).toBeNull();
  });

  it.each([
    'WAHA_UNAVAILABLE',
    'HTTP_502',
    'HTTP_503',
    'HTTP_504',
    'MESSAGE_OUTCOME_UNKNOWN',
    'timeout',
    WHATSAPP_ERROR.GATEWAY_UNAVAILABLE,
    WHATSAPP_ERROR.CORE_SEND_OUTCOME_UNKNOWN,
  ])('holds ambiguous code %s', (errorCode) => {
    expect(classifyLegacyRepairFailure(failed(errorCode), NOW)).toBe('unknown_previous_outcome');
  });

  it('holds an unclassified expired failure instead of repairing it', () => {
    expect(classifyLegacyRepairFailure(failed('MESSAGE_SEND_FAILED'), NOW)).toBe(
      'gateway_window_expired_unsafe',
    );
  });

  it('holds an unclassified fresh failure as provider acceptance not disproven', () => {
    const command = { ...failed('MESSAGE_SEND_FAILED'), firstAttemptAt: NOW, createdAt: NOW };
    expect(classifyLegacyRepairFailure(command, NOW)).toBe('provider_acceptance_not_disproven');
  });

  it('uses a repair transport key only for the queued operator dispatch', () => {
    const logical = whatsAppOutboundIdempotencyKey('msg-1');
    const command = {
      status: 'PENDING',
      payload: { accountId: 'acc_live', chatId: '1@g.us', repairGeneration: 1 },
    };
    expect(whatsAppTransportIdempotencyKey(command, 'QUEUED', logical, 'msg-1')).toBe(
      `${logical}:repair:1`,
    );
    expect(whatsAppTransportIdempotencyKey(command, 'OUTCOME_UNKNOWN', logical, 'msg-1')).toBe(
      logical,
    );
  });
});
