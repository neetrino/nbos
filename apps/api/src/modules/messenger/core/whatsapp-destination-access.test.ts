import { describe, expect, it, vi } from 'vitest';
import { WhatsAppGatewayHttpError } from '../../integrations/whatsapp-gateway/whatsapp-gateway.errors';
import { probeWhatsAppGroupAccess } from '../../integrations/whatsapp-gateway/whatsapp-destination-access';
import { planLegacyDefaultAccountMigration } from './legacy-whatsapp-default-account.ops';

const CHAT = '120363408874132550@g.us';
const CONFIG = { baseUrl: 'https://gateway.example', apiToken: 'secret' };

describe('WhatsApp group access probe', () => {
  it('accepts a group the gateway returns with the same id', async () => {
    const verdict = await probeWhatsAppGroupAccess(
      { getGroup: vi.fn().mockResolvedValue({ id: CHAT, name: 'Finance' }) },
      CONFIG,
      CHAT,
    );
    expect(verdict).toBe('accessible');
  });

  it('rejects a missing group', async () => {
    const verdict = await probeWhatsAppGroupAccess(
      {
        getGroup: vi
          .fn()
          .mockRejectedValue(new WhatsAppGatewayHttpError(404, 'HTTP_404', 'missing')),
      },
      CONFIG,
      CHAT,
    );
    expect(verdict).toBe('missing');
  });

  it('rejects a timeout instead of treating the group as accessible', async () => {
    const verdict = await probeWhatsAppGroupAccess(
      {
        getGroup: vi
          .fn()
          .mockRejectedValue(new WhatsAppGatewayHttpError(503, 'WAHA_UNAVAILABLE', 'timeout')),
      },
      CONFIG,
      CHAT,
    );
    expect(verdict).toBe('unavailable');
  });

  it('rejects an id that does not match the requested group', async () => {
    const verdict = await probeWhatsAppGroupAccess(
      { getGroup: vi.fn().mockResolvedValue({ id: '9999999999@g.us', name: 'Other' }) },
      CONFIG,
      CHAT,
    );
    expect(verdict).toBe('unavailable');
  });
});

describe('legacy mapping dry-run', () => {
  it('does not write while planning a verified mapping', async () => {
    const updateMany = vi.fn();
    const prisma = {
      messengerExternalConversationMapping: {
        findMany: vi
          .fn()
          .mockResolvedValue([
            { id: 'map-1', conversationId: 'conv-1', externalConversationId: CHAT },
          ]),
        findUnique: vi.fn().mockResolvedValue(null),
        updateMany,
      },
    };
    const plans = await planLegacyDefaultAccountMigration(
      prisma as never,
      'acc_live',
      async () => 'accessible',
    );
    expect(plans).toEqual([
      expect.objectContaining({
        action: 'migrate',
        reason: 'gateway_verified',
        mappingId: 'map-1',
      }),
    ]);
    expect(updateMany).not.toHaveBeenCalled();
  });
});
