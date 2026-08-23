import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { encrypt } from '../../../common/utils/crypto';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { AiPlatformAuditService } from '../ai-platform-audit.service';
import { AI_AUDIT_ACTION, AI_AUDIT_ENTITY } from '../ai-platform.constants';
import { AiProviderAdapterRegistry } from './ai-provider-adapter.registry';
import { AiProviderConnectionService } from './ai-provider-connection.service';
import { assertNoProviderSecretFields } from './ai-provider-key';
import { AiProviderSecretStore } from './ai-provider-secret.store';

const ACTOR_ID = 'emp-admin';
const API_KEY = 'sk-test-provider-secret-value-12345';
const ENCRYPTION_KEY = 'test-credentials-encryption-key-32ch';

function connectionRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'conn-1',
    provider: 'OPENAI',
    name: 'OpenAI Prod',
    status: 'ACTIVE',
    keyPrefix: 'sk-…2345',
    providerOrganizationId: null,
    providerProjectId: null,
    baseUrl: null,
    lastValidatedAt: null,
    lastModelSyncAt: null,
    createdById: ACTOR_ID,
    disabledAt: null,
    revokedAt: null,
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date('2026-08-01T00:00:00.000Z'),
    ...overrides,
  };
}

function lockRow(prisma: MockPrisma, row: ReturnType<typeof connectionRow>) {
  prisma.$queryRaw.mockResolvedValue([{ id: row.id }]);
  prisma.aiProviderConnection.findUniqueOrThrow.mockResolvedValue(row);
}

describe('AiProviderConnectionService', () => {
  let prisma: MockPrisma;
  let audit: AiPlatformAuditService;
  let service: AiProviderConnectionService;
  let adapters: AiProviderAdapterRegistry;

  beforeEach(() => {
    prisma = createMockPrisma();
    audit = {
      logAdminAction: vi.fn(),
      logMachineAction: vi.fn(),
    } as unknown as AiPlatformAuditService;
    const secrets = new AiProviderSecretStore(
      prisma as never,
      {
        getOrThrow: vi.fn(() => ENCRYPTION_KEY),
      } as never,
    );
    adapters = {
      get: vi.fn(() => ({
        validate: vi.fn().mockResolvedValue({ ok: true, errorCode: null }),
        listModels: vi.fn().mockResolvedValue([]),
      })),
    } as unknown as AiProviderAdapterRegistry;
    service = new AiProviderConnectionService(prisma as never, audit, secrets, adapters);
  });

  it('persists a connection without returning the API key', async () => {
    prisma.aiProviderConnection.create.mockResolvedValue(connectionRow());

    const view = await service.create(
      { provider: 'OPENAI', name: '  OpenAI Prod  ', apiKey: API_KEY },
      ACTOR_ID,
    );

    expect(view).not.toHaveProperty('apiKey');
    expect(view).not.toHaveProperty('encryptedApiKey');
    expect(JSON.stringify(view)).not.toContain(API_KEY);
    expect(prisma.aiProviderSecret.upsert).toHaveBeenCalled();
    const secretWrite = prisma.aiProviderSecret.upsert.mock.calls[0]?.[0] as {
      create: { encryptedApiKey: string };
    };
    expect(secretWrite.create.encryptedApiKey).not.toBe(API_KEY);
    expect(secretWrite.create.encryptedApiKey.startsWith('v2:')).toBe(true);
    const changes = (audit.logAdminAction as ReturnType<typeof vi.fn>).mock.calls[0]?.[0].changes;
    assertNoProviderSecretFields(changes);
    expect(audit.logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: AI_AUDIT_ENTITY.providerConnection,
        action: AI_AUDIT_ACTION.providerCreated,
      }),
      prisma,
    );
  });

  it('rejects an http or private baseUrl before the secret is written', async () => {
    await expect(
      service.create(
        { provider: 'OPENAI', name: 'OpenAI SSRF', apiKey: API_KEY, baseUrl: 'http://127.0.0.1' },
        ACTOR_ID,
      ),
    ).rejects.toThrow(/HTTPS|not allowed|allowlist/i);
    expect(prisma.aiProviderConnection.create).not.toHaveBeenCalled();
    expect(prisma.aiProviderSecret.upsert).not.toHaveBeenCalled();
  });

  it('allows a second connection for the same provider', async () => {
    prisma.aiProviderConnection.create.mockResolvedValue(
      connectionRow({ id: 'conn-2', name: 'OpenAI Test' }),
    );
    await service.create({ provider: 'OPENAI', name: 'OpenAI Test', apiKey: API_KEY }, ACTOR_ID);
    expect(prisma.aiProviderConnection.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ provider: 'OPENAI', name: 'OpenAI Test' }),
    });
  });

  it('rotates the key and never echoes the replacement', async () => {
    const nextKey = 'sk-test-provider-secret-value-99999';
    lockRow(prisma, connectionRow());
    prisma.aiProviderSecret.findUnique.mockResolvedValue({
      connectionId: 'conn-1',
      encryptedApiKey: encrypt(API_KEY, ENCRYPTION_KEY),
    });
    prisma.aiProviderConnection.update.mockResolvedValue(connectionRow({ keyPrefix: 'sk-…9999' }));
    const view = await service.rotateKey('conn-1', nextKey, ACTOR_ID);
    expect(JSON.stringify(view)).not.toContain(nextKey);
    const changes = (audit.logAdminAction as ReturnType<typeof vi.fn>).mock.calls[0]?.[0].changes;
    assertNoProviderSecretFields(changes);
    expect(changes).toEqual({ keyPrefix: expect.any(String), statusAtCommit: 'ACTIVE' });
  });

  it('clears lastValidatedAt when validation-relevant config changes', async () => {
    lockRow(prisma, connectionRow({ lastValidatedAt: new Date('2026-08-01T00:00:00.000Z') }));
    prisma.aiProviderConnection.update.mockResolvedValue(connectionRow());
    await service.update('conn-1', { providerOrganizationId: 'org-b' }, ACTOR_ID);
    expect(prisma.aiProviderConnection.update).toHaveBeenCalledWith({
      where: { id: 'conn-1' },
      data: expect.objectContaining({
        providerOrganizationId: 'org-b',
        lastValidatedAt: null,
      }),
    });
  });

  it('does not clear lastValidatedAt on a name-only update', async () => {
    lockRow(prisma, connectionRow({ lastValidatedAt: new Date('2026-08-01T00:00:00.000Z') }));
    prisma.aiProviderConnection.update.mockResolvedValue(connectionRow({ name: 'Renamed' }));
    await service.update('conn-1', { name: 'Renamed' }, ACTOR_ID);
    expect(prisma.aiProviderConnection.update).toHaveBeenCalledWith({
      where: { id: 'conn-1' },
      data: { name: 'Renamed' },
    });
  });

  it('revokes by deleting the secret and refusing later mutation', async () => {
    lockRow(prisma, connectionRow());
    prisma.aiProviderConnection.update.mockResolvedValue(connectionRow({ status: 'REVOKED' }));
    await service.revoke('conn-1', ACTOR_ID);
    expect(prisma.aiProviderSecret.deleteMany).toHaveBeenCalledWith({
      where: { connectionId: 'conn-1' },
    });
    lockRow(prisma, connectionRow({ status: 'REVOKED', revokedAt: new Date() }));
    await expect(service.disable('conn-1', ACTOR_ID)).rejects.toThrow(BadRequestException);
  });
});
