import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { encrypt } from '../../../common/utils/crypto';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { AiPlatformAuditService } from '../ai-platform-audit.service';
import { AiProviderAdapterRegistry } from './ai-provider-adapter.registry';
import { AiProviderConnectionService } from './ai-provider-connection.service';
import { AiProviderSecretStore } from './ai-provider-secret.store';
import type { AiProviderCredentials } from './ai-provider.types';

const ACTOR_ID = 'emp-admin';
const API_KEY = 'sk-test-provider-secret-value-12345';
const ENCRYPTION_KEY = 'test-credentials-encryption-key-32ch';
const NEXT_KEY = 'sk-test-provider-secret-value-99999';

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

describe('AiProviderConnectionService validation snapshot', () => {
  let prisma: MockPrisma;
  let service: AiProviderConnectionService;
  let adapters: AiProviderAdapterRegistry;
  let validateFn: ReturnType<typeof vi.fn>;
  let logAdminAction: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    prisma = createMockPrisma();
    logAdminAction = vi.fn();
    const audit = {
      logAdminAction,
      logMachineAction: vi.fn(),
    } as unknown as AiPlatformAuditService;
    const secrets = new AiProviderSecretStore(
      prisma as never,
      { getOrThrow: vi.fn(() => ENCRYPTION_KEY) } as never,
    );
    validateFn = vi.fn().mockResolvedValue({ ok: true, errorCode: null });
    adapters = {
      get: vi.fn(() => ({ validate: validateFn, listModels: vi.fn().mockResolvedValue([]) })),
    } as unknown as AiProviderAdapterRegistry;
    service = new AiProviderConnectionService(prisma as never, audit, secrets, adapters);
    prisma.$queryRaw.mockResolvedValue([{ id: 'conn-1' }]);
    prisma.aiProviderSecret.findUnique.mockResolvedValue({
      connectionId: 'conn-1',
      encryptedApiKey: encrypt(API_KEY, ENCRYPTION_KEY),
    });
  });

  it('validates the snapshotted org, project, baseUrl and key', async () => {
    const stored = connectionRow({
      providerOrganizationId: 'org-a',
      providerProjectId: 'proj-a',
      baseUrl: 'https://api.example.test',
    });
    prisma.aiProviderConnection.findUniqueOrThrow.mockResolvedValue(stored);
    prisma.aiProviderConnection.findUnique.mockResolvedValue(
      connectionRow({ providerOrganizationId: 'org-b' }),
    );
    prisma.aiProviderConnection.update.mockResolvedValue(stored);

    const outcome = await service.validate('conn-1', ACTOR_ID);

    expect(outcome.result.ok).toBe(true);
    expect(JSON.stringify(outcome)).not.toContain(API_KEY);
    expect(validateFn).toHaveBeenCalledWith({
      apiKey: API_KEY,
      baseUrl: 'https://api.example.test',
      organizationId: 'org-a',
      projectId: 'proj-a',
    } satisfies AiProviderCredentials);
  });

  it('rejects when organization changes between snapshot and commit', async () => {
    let lockCalls = 0;
    prisma.aiProviderConnection.findUniqueOrThrow.mockImplementation(async () => {
      lockCalls += 1;
      return lockCalls === 1
        ? connectionRow({ providerOrganizationId: 'org-a' })
        : connectionRow({ providerOrganizationId: 'org-b' });
    });

    await expect(service.validate('conn-1', ACTOR_ID)).rejects.toThrow(ConflictException);
    expect(prisma.aiProviderConnection.update).not.toHaveBeenCalled();
  });

  it('rejects when the ciphertext changes between snapshot and commit', async () => {
    const cipherA = encrypt(API_KEY, ENCRYPTION_KEY);
    const cipherB = encrypt(NEXT_KEY, ENCRYPTION_KEY);
    let secretCalls = 0;
    prisma.aiProviderSecret.findUnique.mockImplementation(async () => {
      secretCalls += 1;
      return {
        connectionId: 'conn-1',
        encryptedApiKey: secretCalls >= 2 ? cipherB : cipherA,
      };
    });
    prisma.aiProviderConnection.findUniqueOrThrow.mockResolvedValue(connectionRow());

    await expect(service.validate('conn-1', ACTOR_ID)).rejects.toThrow(ConflictException);
    expect(prisma.aiProviderConnection.update).not.toHaveBeenCalled();
  });

  it('keeps the first snapshot when a later reread would see a different org', async () => {
    prisma.aiProviderConnection.findUniqueOrThrow.mockResolvedValue(
      connectionRow({ providerOrganizationId: 'org-a' }),
    );
    prisma.aiProviderConnection.findUnique.mockResolvedValue(
      connectionRow({ providerOrganizationId: 'org-b' }),
    );
    prisma.aiProviderConnection.update.mockResolvedValue(
      connectionRow({ providerOrganizationId: 'org-a' }),
    );

    await service.validate('conn-1', ACTOR_ID);

    expect(validateFn).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: 'org-a', apiKey: API_KEY }),
    );
  });

  it('does not treat a metadata-only updatedAt change as a config change', async () => {
    let lockCalls = 0;
    prisma.aiProviderConnection.findUniqueOrThrow.mockImplementation(async () => {
      lockCalls += 1;
      return lockCalls === 1
        ? connectionRow({ updatedAt: new Date('2026-08-01T00:00:00.000Z') })
        : connectionRow({ updatedAt: new Date('2026-08-01T00:01:00.000Z') });
    });
    prisma.aiProviderConnection.update.mockResolvedValue(
      connectionRow({ lastValidatedAt: new Date() }),
    );

    const outcome = await service.validate('conn-1', ACTOR_ID);
    expect(outcome.result.ok).toBe(true);
  });

  it('validates a stored Anthropic connection with the Anthropic adapter', async () => {
    prisma.aiProviderConnection.findUniqueOrThrow.mockResolvedValue(
      connectionRow({ provider: 'ANTHROPIC' }),
    );
    prisma.aiProviderConnection.update.mockResolvedValue(connectionRow({ provider: 'ANTHROPIC' }));

    await service.validate('conn-1', ACTOR_ID);

    expect(adapters.get).toHaveBeenCalledWith('ANTHROPIC');
  });

  it('validates a replacement key against stored org and project', async () => {
    prisma.aiProviderConnection.findUniqueOrThrow.mockResolvedValue(
      connectionRow({
        providerOrganizationId: 'org-stored',
        providerProjectId: 'proj-stored',
        baseUrl: 'https://api.example.test',
      }),
    );

    const result = await service.validateReplacementKey('conn-1', NEXT_KEY, ACTOR_ID);

    expect(result.ok).toBe(true);
    expect(validateFn).toHaveBeenCalledWith({
      apiKey: NEXT_KEY,
      baseUrl: 'https://api.example.test',
      organizationId: 'org-stored',
      projectId: 'proj-stored',
    });
  });

  it('does not stamp lastValidatedAt when the connection is disabled mid-flight', async () => {
    let lockCalls = 0;
    prisma.aiProviderConnection.findUniqueOrThrow.mockImplementation(async () => {
      lockCalls += 1;
      return lockCalls === 1 ? connectionRow() : connectionRow({ status: 'DISABLED' });
    });
    prisma.aiProviderConnection.update.mockResolvedValue(connectionRow({ status: 'DISABLED' }));

    const outcome = await service.validate('conn-1', ACTOR_ID);

    expect(outcome.result.ok).toBe(true);
    expect(prisma.aiProviderConnection.update).toHaveBeenCalledWith({
      where: { id: 'conn-1' },
      data: {},
    });
    expect(logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'PROVIDER_CONNECTION_VALIDATED',
        changes: expect.objectContaining({ ok: true, statusAtCommit: 'DISABLED' }),
      }),
      expect.anything(),
    );
  });

  it('audits a failed replacement-key preflight without storing the key', async () => {
    validateFn.mockResolvedValue({ ok: false, errorCode: 'INVALID_KEY' });
    prisma.aiProviderConnection.findUniqueOrThrow.mockResolvedValue(connectionRow());

    const result = await service.validateReplacementKey('conn-1', NEXT_KEY, ACTOR_ID);

    expect(result.ok).toBe(false);
    expect(prisma.aiProviderSecret.upsert).not.toHaveBeenCalled();
    expect(logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'PROVIDER_KEY_PREFLIGHT_VALIDATED',
        actingEmployeeId: ACTOR_ID,
        changes: { ok: false, errorCode: 'INVALID_KEY' },
      }),
      expect.anything(),
    );
    expect(JSON.stringify(logAdminAction.mock.calls)).not.toContain(NEXT_KEY);
  });

  it('audits a rotate preflight failure before rejecting the rotation', async () => {
    validateFn.mockResolvedValue({ ok: false, errorCode: 'INVALID_KEY' });
    prisma.aiProviderConnection.findUniqueOrThrow.mockResolvedValue(connectionRow());

    await expect(service.rotateKey('conn-1', NEXT_KEY, ACTOR_ID)).rejects.toThrow(
      BadRequestException,
    );

    expect(logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PROVIDER_KEY_PREFLIGHT_VALIDATED' }),
      expect.anything(),
    );
  });

  it('does not store a replacement key that fails validation', async () => {
    validateFn.mockResolvedValue({ ok: false, errorCode: 'INVALID_KEY' });
    prisma.aiProviderConnection.findUniqueOrThrow.mockResolvedValue(connectionRow());

    await expect(service.rotateKey('conn-1', NEXT_KEY, ACTOR_ID)).rejects.toThrow(
      BadRequestException,
    );
    expect(prisma.aiProviderSecret.upsert).not.toHaveBeenCalled();
    expect(prisma.aiProviderConnection.update).not.toHaveBeenCalled();
  });

  it('rotates with stored metadata and stamps lastValidatedAt after success', async () => {
    prisma.aiProviderConnection.findUniqueOrThrow.mockResolvedValue(
      connectionRow({
        providerOrganizationId: 'org-stored',
        providerProjectId: 'proj-stored',
      }),
    );
    prisma.aiProviderConnection.update.mockResolvedValue(connectionRow({ keyPrefix: 'sk-…9999' }));

    await service.rotateKey('conn-1', NEXT_KEY, ACTOR_ID);

    expect(validateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: NEXT_KEY,
        organizationId: 'org-stored',
        projectId: 'proj-stored',
      }),
    );
    expect(prisma.aiProviderConnection.update).toHaveBeenCalledWith({
      where: { id: 'conn-1' },
      data: expect.objectContaining({ lastValidatedAt: expect.any(Date) }),
    });
  });

  it('rotates the key but stamps no validation time when the connection was disabled mid-flight', async () => {
    let lockCalls = 0;
    prisma.aiProviderConnection.findUniqueOrThrow.mockImplementation(async () => {
      lockCalls += 1;
      return lockCalls === 1 ? connectionRow() : connectionRow({ status: 'DISABLED' });
    });
    prisma.aiProviderConnection.update.mockResolvedValue(connectionRow({ status: 'DISABLED' }));

    await service.rotateKey('conn-1', NEXT_KEY, ACTOR_ID);

    expect(prisma.aiProviderConnection.update).toHaveBeenCalledWith({
      where: { id: 'conn-1' },
      data: { keyPrefix: expect.any(String) },
    });
    expect(logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'PROVIDER_KEY_ROTATED',
        changes: expect.objectContaining({ statusAtCommit: 'DISABLED' }),
      }),
      expect.anything(),
    );
  });
});
