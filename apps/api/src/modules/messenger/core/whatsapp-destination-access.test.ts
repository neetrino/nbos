import { describe, expect, it, vi } from 'vitest';
import { classifyLegacyGroupAccount } from '../../integrations/whatsapp-gateway/whatsapp-gateway-account';
import { WhatsAppGatewayHttpError } from '../../integrations/whatsapp-gateway/whatsapp-gateway.errors';
import {
  probeWhatsAppGroupAccess,
  probeWhatsAppGroupForAccount,
} from '../../integrations/whatsapp-gateway/whatsapp-destination-access';
import {
  planLegacyDefaultAccountMigration,
  planLegacyDefaultMapping,
} from './legacy-whatsapp-default-account.ops';

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

describe('legacy group account identity', () => {
  const row = {
    id: 'map-1',
    conversationId: 'conv-1',
    externalConversationId: CHAT,
  };
  const connected = (id: string) => ({ id, isActive: true, status: 'CONNECTED' });

  it('migrates when the single connected account matches and the group exists', async () => {
    const verdict = await probeWhatsAppGroupForAccount(
      accountClient('acc_live', CHAT),
      CONFIG,
      CHAT,
      'acc_live',
    );
    expect(verdict).toBe('accessible');
    expect(
      planLegacyDefaultMapping({ row, conflictConversationId: null, destination: verdict }).action,
    ).toBe('migrate');
  });

  it('holds a different gateway account for manual review', async () => {
    const verdict = await probeWhatsAppGroupForAccount(
      accountClient('acc_other', CHAT),
      CONFIG,
      CHAT,
      'acc_live',
    );
    expect(verdict).toBe('account_mismatch');
    expect(
      planLegacyDefaultMapping({ row, conflictConversationId: null, destination: verdict }),
    ).toEqual(expect.objectContaining({ action: 'manual_review', reason: 'account_mismatch' }));
  });

  it('holds an unavailable account identity for manual review', () => {
    expect(
      classifyLegacyGroupAccount([connected('acc_live'), connected('acc_other')], 'acc_live'),
    ).toBe('unknown');
    expect(
      planLegacyDefaultMapping({
        row,
        conflictConversationId: null,
        destination: 'account_unknown',
      }),
    ).toEqual(
      expect.objectContaining({ action: 'manual_review', reason: 'account_identity_unavailable' }),
    );
  });

  it('holds a matching account when the group is missing', async () => {
    const client = accountClient('acc_live', CHAT);
    client.getGroup.mockRejectedValue(
      new WhatsAppGatewayHttpError(404, 'GROUP_NOT_FOUND', 'missing'),
    );
    const verdict = await probeWhatsAppGroupForAccount(client, CONFIG, CHAT, 'acc_live');
    expect(verdict).toBe('missing');
    expect(
      planLegacyDefaultMapping({ row, conflictConversationId: null, destination: verdict }),
    ).toEqual(expect.objectContaining({ action: 'manual_review', reason: 'group_not_accessible' }));
  });
});

function accountClient(accountId: string, groupId: string) {
  return {
    listAccounts: vi
      .fn()
      .mockResolvedValue([{ id: accountId, isActive: true, status: 'CONNECTED' }]),
    getGroup: vi.fn().mockResolvedValue({ id: groupId, name: 'Finance' }),
  };
}

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
