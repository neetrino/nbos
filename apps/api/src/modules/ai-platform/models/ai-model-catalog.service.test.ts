import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { AiPlatformAuditService } from '../ai-platform-audit.service';
import { AI_AUDIT_ACTION } from '../ai-platform.constants';
import { AiModelCatalogService } from './ai-model-catalog.service';

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
    evaluationStatus: 'NOT_EVALUATED',
    notes: null,
    aliasOf: null,
    snapshotId: null,
    activatedAt: null,
    activatedById: null,
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date('2026-08-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('AiModelCatalogService', () => {
  let prisma: MockPrisma;
  let audit: AiPlatformAuditService;
  let service: AiModelCatalogService;

  beforeEach(() => {
    prisma = createMockPrisma();
    audit = {
      logAdminAction: vi.fn(),
      logMachineAction: vi.fn(),
    } as unknown as AiPlatformAuditService;
    service = new AiModelCatalogService(prisma as never, audit);
  });

  it('activates a DISCOVERED model explicitly and audits it', async () => {
    prisma.aiModel.findUnique.mockResolvedValue(modelRow());
    prisma.aiModel.update.mockResolvedValue(modelRow({ status: 'ACTIVE' }));
    const view = await service.activate('model-1', 'emp-admin');
    expect(view.status).toBe('ACTIVE');
    expect(prisma.aiModel.update).toHaveBeenCalledWith({
      where: { id: 'model-1' },
      data: expect.objectContaining({ status: 'ACTIVE' }),
    });
    expect(audit.logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: AI_AUDIT_ACTION.modelActivated }),
      prisma,
    );
  });

  it('refuses to activate an UNAVAILABLE model', async () => {
    prisma.aiModel.findUnique.mockResolvedValue(modelRow({ status: 'UNAVAILABLE' }));
    await expect(service.activate('model-1', 'emp-admin')).rejects.toThrow(BadRequestException);
  });

  it('keeps suitability tags separate from provider metadata', async () => {
    prisma.aiModel.findUnique.mockResolvedValue(modelRow());
    prisma.aiModel.update.mockResolvedValue(
      modelRow({ suitabilityTags: ['CLIENT_SUPPORT'], notes: 'eval pending' }),
    );
    const view = await service.updateSuitability(
      'model-1',
      { suitabilityTags: ['client_support'], notes: 'eval pending' },
      'emp-admin',
    );
    expect(view.suitabilityTags).toEqual(['CLIENT_SUPPORT']);
    expect(view.providerMetadata).toEqual({ owned_by: 'openai' });
  });

  it('lets an admin set evaluation status without changing catalog status', async () => {
    prisma.aiModel.findUnique.mockResolvedValue(modelRow());
    prisma.aiModel.update.mockResolvedValue(modelRow({ evaluationStatus: 'EVALUATED' }));
    const view = await service.updateSuitability(
      'model-1',
      { evaluationStatus: 'EVALUATED' },
      'emp-admin',
    );
    expect(view.evaluationStatus).toBe('EVALUATED');
    expect(view.status).toBe('DISCOVERED');
    expect(prisma.aiModel.update).toHaveBeenCalledWith({
      where: { id: 'model-1' },
      data: expect.objectContaining({ evaluationStatus: 'EVALUATED' }),
    });
    expect(prisma.aiModel.update.mock.calls[0][0].data).not.toHaveProperty('status');
  });
});
