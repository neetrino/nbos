import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { EXTENSION_STAGE_GATE_ERROR_CODE } from './extension-stage-gates';
import { DEPRECATED_PATCH_STATUS_TERMINAL_AUDIT_ACTION } from '../delivery-status-deprecation';
import {
  createExtensionsServiceHarness,
  clearExtensionsServiceHarness,
  type ExtensionsServiceHarness,
  readExceptionResponse,
} from './extensions.service.test-harness';

vi.mock('../../bonus/product-bonus-pool-sync', () => ({
  syncProductBonusPoolForOrder: vi.fn().mockResolvedValue(undefined),
}));

describe('ExtensionsService', () => {
  let service: ExtensionsServiceHarness['service'];
  let prisma: ExtensionsServiceHarness['prisma'];
  let auditService: ExtensionsServiceHarness['auditService'];

  beforeEach(() => {
    const harness = createExtensionsServiceHarness();
    clearExtensionsServiceHarness(harness);
    service = harness.service;
    prisma = harness.prisma;
    auditService = harness.auditService;
  });

  describe('updateStatus — stage gate', () => {
    it('requires description, assignee, and order for NEW → DEVELOPMENT', async () => {
      prisma.extension.findUnique.mockResolvedValue({
        id: 'e1',
        status: 'NEW',
        description: null,
        assignedTo: null,
        order: null,
      });

      await expect(service.updateStatus('e1', 'DEVELOPMENT', 'emp-audit')).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.extension.update).not.toHaveBeenCalled();
    });

    it('returns structured readiness blockers for NEW → DEVELOPMENT', async () => {
      prisma.extension.findUnique.mockResolvedValue({
        id: 'e1',
        status: 'NEW',
        description: '',
        assignedTo: null,
        order: null,
      });

      const error = await service
        .updateStatus('e1', 'DEVELOPMENT', 'emp-audit')
        .catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(BadRequestException);
      expect(readExceptionResponse(error)).toMatchObject({
        code: EXTENSION_STAGE_GATE_ERROR_CODE,
        errors: [
          { field: 'description', message: expect.any(String) },
          { field: 'assignedTo', message: expect.any(String) },
        ],
      });
      expect(prisma.extension.update).not.toHaveBeenCalled();
    });

    it('allows NEW → DEVELOPMENT', async () => {
      prisma.extension.findUnique.mockResolvedValue({
        id: 'e1',
        status: 'NEW',
        description: 'Add loyalty widget',
        assignedTo: 'dev-1',
        order: { id: 'ord-1' },
      });
      prisma.extension.update.mockResolvedValue({ id: 'e1', status: 'DEVELOPMENT' });
      const result = await service.updateStatus('e1', 'DEVELOPMENT', 'emp-audit');
      expect(result.status).toBe('DEVELOPMENT');
    });

    it('allows QA → TRANSFER', async () => {
      prisma.extension.findUnique.mockResolvedValue({ id: 'e1', status: 'QA' });
      prisma.extension.update.mockResolvedValue({ id: 'e1', status: 'TRANSFER' });
      const result = await service.updateStatus('e1', 'TRANSFER', 'emp-audit');
      expect(result.status).toBe('TRANSFER');
    });

    it('rejects DONE → DEVELOPMENT (terminal state)', async () => {
      prisma.extension.findUnique.mockResolvedValue({ id: 'e1', status: 'DONE' });
      await expect(service.updateStatus('e1', 'DEVELOPMENT', 'emp-audit')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects NEW → QA (skip not allowed)', async () => {
      prisma.extension.findUnique.mockResolvedValue({ id: 'e1', status: 'NEW' });
      await expect(service.updateStatus('e1', 'QA', 'emp-audit')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('allows any → LOST', async () => {
      prisma.extension.findUnique.mockResolvedValue({
        id: 'e1',
        projectId: 'proj-1',
        status: 'DEVELOPMENT',
      });
      prisma.extension.update.mockResolvedValue({ id: 'e1', status: 'LOST' });
      const result = await service.updateStatus('e1', 'LOST', 'emp-audit');
      expect(result.status).toBe('LOST');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: DEPRECATED_PATCH_STATUS_TERMINAL_AUDIT_ACTION,
          entityType: 'EXTENSION',
          entityId: 'e1',
          userId: 'emp-audit',
          projectId: 'proj-1',
          changes: expect.objectContaining({
            deprecatedApiPath: 'PATCH /projects/extensions/:id/status',
            targetStatus: 'LOST',
          }),
        }),
      );
    });

    it('allows QA → DEVELOPMENT (back for fixes)', async () => {
      prisma.extension.findUnique.mockResolvedValue({ id: 'e1', status: 'QA' });
      prisma.extension.update.mockResolvedValue({ id: 'e1', status: 'DEVELOPMENT' });
      const result = await service.updateStatus('e1', 'DEVELOPMENT', 'emp-audit');
      expect(result.status).toBe('DEVELOPMENT');
    });
  });
});
