import { describe, it, expect, beforeEach } from 'vitest';
import { ExtensionsService } from './extensions.service';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EXTENSION_STAGE_GATE_ERROR_CODE } from './extension-stage-gates';

describe('ExtensionsService', () => {
  let service: ExtensionsService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new ExtensionsService(prisma as never);
  });

  describe('findAll', () => {
    it('returns paginated empty list', async () => {
      const result = await service.findAll({});
      expect(result.items).toEqual([]);
      expect(result.meta.totalPages).toBe(0);
    });

    it('attaches readiness metadata', async () => {
      prisma.extension.findMany.mockResolvedValue([
        {
          id: 'e1',
          status: 'NEW',
          description: null,
          assignedTo: null,
          order: null,
        },
      ]);

      const result = await service.findAll({});

      expect(result.items[0]).toMatchObject({
        readiness: {
          isReadyForDevelopment: false,
          missing: [
            { field: 'description', message: expect.any(String) },
            { field: 'assignedTo', message: expect.any(String) },
            { field: 'order', message: expect.any(String) },
          ],
        },
      });
    });

    it('applies projectId filter', async () => {
      await service.findAll({ projectId: 'proj-1' });
      expect(prisma.extension.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ projectId: 'proj-1' }),
        }),
      );
    });

    it('applies productId filter', async () => {
      await service.findAll({ productId: 'prod-1' });
      expect(prisma.extension.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ productId: 'prod-1' }),
        }),
      );
    });

    it('applies status filter', async () => {
      await service.findAll({ status: 'DEVELOPMENT' });
      expect(prisma.extension.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'DEVELOPMENT' }),
        }),
      );
    });

    it('applies size filter', async () => {
      await service.findAll({ size: 'LARGE' });
      expect(prisma.extension.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ size: 'LARGE' }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('throws NotFoundException when not found', async () => {
      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });

    it('returns extension when found', async () => {
      prisma.extension.findUnique.mockResolvedValue({ id: 'e1', name: 'Feature X' });
      const result = await service.findById('e1');
      expect(result.name).toBe('Feature X');
    });
  });

  describe('create', () => {
    it('creates extension with required fields', async () => {
      prisma.extension.create.mockResolvedValue({
        id: 'e1',
        name: 'Add login',
        size: 'SMALL',
      });
      const result = await service.create({
        projectId: 'proj-1',
        name: 'Add login',
      });
      expect(result.size).toBe('SMALL');
    });

    it('creates extension with product link', async () => {
      prisma.extension.create.mockResolvedValue({ id: 'e1', name: 'Feature' });
      await service.create({
        projectId: 'proj-1',
        productId: 'prod-1',
        name: 'Feature',
        size: 'MEDIUM',
        assignedTo: 'dev-1',
      });
      expect(prisma.extension.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            productId: 'prod-1',
            size: 'MEDIUM',
            assignedTo: 'dev-1',
          }),
        }),
      );
    });
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

      await expect(service.updateStatus('e1', 'DEVELOPMENT')).rejects.toThrow(BadRequestException);
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
        .updateStatus('e1', 'DEVELOPMENT')
        .catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(BadRequestException);
      expect(readExceptionResponse(error)).toMatchObject({
        code: EXTENSION_STAGE_GATE_ERROR_CODE,
        errors: [
          { field: 'description', message: expect.any(String) },
          { field: 'assignedTo', message: expect.any(String) },
          { field: 'order', message: expect.any(String) },
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
      const result = await service.updateStatus('e1', 'DEVELOPMENT');
      expect(result.status).toBe('DEVELOPMENT');
    });

    it('allows QA → TRANSFER', async () => {
      prisma.extension.findUnique.mockResolvedValue({ id: 'e1', status: 'QA' });
      prisma.extension.update.mockResolvedValue({ id: 'e1', status: 'TRANSFER' });
      const result = await service.updateStatus('e1', 'TRANSFER');
      expect(result.status).toBe('TRANSFER');
    });

    it('rejects DONE → DEVELOPMENT (terminal state)', async () => {
      prisma.extension.findUnique.mockResolvedValue({ id: 'e1', status: 'DONE' });
      await expect(service.updateStatus('e1', 'DEVELOPMENT')).rejects.toThrow(BadRequestException);
    });

    it('rejects NEW → QA (skip not allowed)', async () => {
      prisma.extension.findUnique.mockResolvedValue({ id: 'e1', status: 'NEW' });
      await expect(service.updateStatus('e1', 'QA')).rejects.toThrow(BadRequestException);
    });

    it('allows any → LOST', async () => {
      prisma.extension.findUnique.mockResolvedValue({ id: 'e1', status: 'DEVELOPMENT' });
      prisma.extension.update.mockResolvedValue({ id: 'e1', status: 'LOST' });
      const result = await service.updateStatus('e1', 'LOST');
      expect(result.status).toBe('LOST');
    });

    it('allows QA → DEVELOPMENT (back for fixes)', async () => {
      prisma.extension.findUnique.mockResolvedValue({ id: 'e1', status: 'QA' });
      prisma.extension.update.mockResolvedValue({ id: 'e1', status: 'DEVELOPMENT' });
      const result = await service.updateStatus('e1', 'DEVELOPMENT');
      expect(result.status).toBe('DEVELOPMENT');
    });
  });

  describe('delete', () => {
    it('deletes when found', async () => {
      prisma.extension.findUnique.mockResolvedValue({ id: 'e1' });
      await service.delete('e1');
      expect(prisma.extension.delete).toHaveBeenCalledWith({ where: { id: 'e1' } });
    });
  });

  describe('getStats', () => {
    it('returns stats', async () => {
      prisma.extension.count.mockResolvedValue(3);
      const stats = await service.getStats();
      expect(stats.total).toBe(3);
    });
  });
});

function readExceptionResponse(error: unknown) {
  if (!(error instanceof BadRequestException)) return {};
  const response = error.getResponse();
  return typeof response === 'object' && response !== null ? response : {};
}
