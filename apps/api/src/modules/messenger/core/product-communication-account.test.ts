import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  allowsLegacyWhatsAppDefaultAccount,
  resolveWhatsAppGatewayAccountId,
  WhatsAppGatewayAccountNotConfiguredError,
} from './product-communication-account';

describe('resolveWhatsAppGatewayAccountId', () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
    vi.restoreAllMocks();
  });

  it('fails closed in production when the gateway account is missing', async () => {
    process.env.NODE_ENV = 'production';
    process.env.WHATSAPP_ALLOW_LEGACY_DEFAULT_ACCOUNT = 'true';
    const prisma = {
      whatsAppGatewayConnection: {
        findFirst: vi.fn().mockResolvedValue({ gatewayAccountId: null }),
      },
    };
    await expect(resolveWhatsAppGatewayAccountId(prisma as never)).rejects.toBeInstanceOf(
      WhatsAppGatewayAccountNotConfiguredError,
    );
    expect(allowsLegacyWhatsAppDefaultAccount()).toBe(false);
  });

  it('rejects a stored default account id in production', async () => {
    process.env.NODE_ENV = 'production';
    const prisma = {
      whatsAppGatewayConnection: {
        findFirst: vi.fn().mockResolvedValue({ gatewayAccountId: 'default' }),
      },
    };
    await expect(resolveWhatsAppGatewayAccountId(prisma as never)).rejects.toBeInstanceOf(
      WhatsAppGatewayAccountNotConfiguredError,
    );
  });

  it('keeps the legacy default account outside production', async () => {
    process.env.NODE_ENV = 'test';
    const prisma = {
      whatsAppGatewayConnection: { findFirst: vi.fn().mockResolvedValue(null) },
    };
    await expect(resolveWhatsAppGatewayAccountId(prisma as never)).resolves.toBe('default');
  });

  it('returns the configured account in production', async () => {
    process.env.NODE_ENV = 'production';
    const prisma = {
      whatsAppGatewayConnection: {
        findFirst: vi.fn().mockResolvedValue({ gatewayAccountId: 'acc_live' }),
      },
    };
    await expect(resolveWhatsAppGatewayAccountId(prisma as never)).resolves.toBe('acc_live');
  });
});
