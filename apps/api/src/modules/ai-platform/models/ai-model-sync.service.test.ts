import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { AiPlatformAuditService } from '../ai-platform-audit.service';
import { AiProviderAdapterRegistry } from '../providers/ai-provider-adapter.registry';
import { AiProviderConnectionService } from '../providers/ai-provider-connection.service';
import { AI_MODEL_CATALOG_SYNC_CONTRACT } from './ai-model-catalog.contract';
import { AiModelSyncService } from './ai-model-sync.service';

function modelRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'model-1',
    connectionId: 'conn-1',
    provider: 'OPENAI',
    providerModelId: 'gpt-4o',
    displayName: 'gpt-4o',
    status: 'DISCOVERED',
    discoveredAt: new Date('2026-08-01T00:00:00.000Z'),
    lastSeenAt: new Date('2026-08-01T00:00:00.000Z'),
    providerMetadata: { owned_by: 'openai' },
    suitabilityTags: [],
    notes: null,
    aliasOf: null,
    snapshotId: null,
    activatedAt: null,
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date('2026-08-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('AiModelSyncService', () => {
  let prisma: MockPrisma;
  let service: AiModelSyncService;
  let connections: AiProviderConnectionService;
  let audit: AiPlatformAuditService;

  beforeEach(() => {
    prisma = createMockPrisma();
    audit = {
      logAdminAction: vi.fn(),
      logMachineAction: vi.fn(),
    } as unknown as AiPlatformAuditService;
    connections = {
      credentialsForActive: vi.fn().mockResolvedValue({
        connection: { id: 'conn-1', provider: 'OPENAI', status: 'ACTIVE' },
        credentials: { apiKey: 'sk-test-provider-secret-value-12345' },
      }),
      listAll: vi.fn().mockResolvedValue([{ id: 'conn-1', status: 'ACTIVE' }]),
      markModelSync: vi.fn(),
    } as unknown as AiProviderConnectionService;
    const adapters = {
      get: vi.fn(() => ({
        listModels: vi.fn().mockResolvedValue([
          {
            providerModelId: 'gpt-4o',
            displayName: 'gpt-4o',
            providerMetadata: { owned_by: 'openai' },
            aliasOf: null,
            snapshotId: null,
          },
          {
            providerModelId: 'gpt-5',
            displayName: 'gpt-5',
            providerMetadata: { owned_by: 'openai' },
            aliasOf: null,
            snapshotId: null,
          },
        ]),
      })),
    } as unknown as AiProviderAdapterRegistry;
    service = new AiModelSyncService(prisma as never, connections, adapters, audit);
  });

  it('inserts new models as DISCOVERED and never as ACTIVE', async () => {
    prisma.aiModel.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([modelRow(), modelRow({ id: 'model-2', providerModelId: 'gpt-5' })]);

    const result = await service.syncConnection('conn-1', 'emp-admin');

    expect(prisma.aiModel.create).toHaveBeenCalledTimes(2);
    expect(prisma.aiModel.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ providerModelId: 'gpt-5', status: 'DISCOVERED' }),
    });
    expect(result.created).toBe(2);
    expect(
      result.models.every(
        (model) => model.status !== 'ACTIVE' || model.providerModelId === 'never',
      ),
    ).toBe(true);
  });

  it('exposes a typed SYSTEM scheduled runner', () => {
    expect(AI_MODEL_CATALOG_SYNC_CONTRACT.runnerMethod).toBe('runScheduledCatalogSync');
    expect(AI_MODEL_CATALOG_SYNC_CONTRACT.actorType).toBe('SYSTEM');
    expect(typeof service.runScheduledCatalogSync).toBe('function');
  });

  it('continues scheduled sync after one connection fails and audits as SYSTEM', async () => {
    vi.mocked(connections.listAll).mockResolvedValue([
      { id: 'conn-1', status: 'ACTIVE' },
      { id: 'conn-2', status: 'ACTIVE' },
    ] as never);
    vi.mocked(connections.credentialsForActive)
      .mockRejectedValueOnce(new Error('provider down'))
      .mockResolvedValueOnce({
        connection: { id: 'conn-2', provider: 'ANTHROPIC', status: 'ACTIVE' },
        credentials: { apiKey: 'sk-ant-test-provider-secret-value-12345' },
      } as never);
    prisma.aiModel.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const outcomes = await service.runScheduledCatalogSync();

    expect(outcomes).toEqual([
      { connectionId: 'conn-1', ok: false, errorCode: 'SYNC_FAILED' },
      expect.objectContaining({ connectionId: 'conn-2', ok: true }),
    ]);
    expect(audit.logMachineAction).toHaveBeenCalledWith(
      expect.objectContaining({
        actor: expect.objectContaining({ actor: expect.objectContaining({ type: 'SYSTEM' }) }),
      }),
      prisma,
    );
    expect(audit.logAdminAction).not.toHaveBeenCalled();
  });
});
