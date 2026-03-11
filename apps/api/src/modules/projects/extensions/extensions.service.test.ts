import { describe, it, expect, beforeEach } from 'vitest';
import { ExtensionsService } from './extensions.service';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ExtensionsService', () => {
  let service: ExtensionsService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new ExtensionsService(prisma as never);
  });

  describe('findAll', () => {
    it('returns paginated result', async () => {
      const result = await service.findAll({});
      expect(result.meta.page).toBe(1);
    });

    it('applies filters', async () => {
      await service.findAll({ projectId: 'p1', status: 'NEW', size: 'SMALL' });
      expect(prisma.extension.findMany).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('throws NotFoundException', async () => {
      await expect(service.findById('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates extension', async () => {
      prisma.extension.create.mockResolvedValue({ id: '1', name: 'Blog', size: 'SMALL' });
      const result = await service.create({ projectId: 'p1', name: 'Blog' });
      expect(result.name).toBe('Blog');
    });
  });

  describe('updateStatus', () => {
    it('allows valid transition NEW -> IN_PROGRESS', async () => {
      prisma.extension.findUnique.mockResolvedValue({ id: '1', status: 'NEW' });
      prisma.extension.update.mockResolvedValue({ id: '1', status: 'IN_PROGRESS' });
      const result = await service.updateStatus('1', 'IN_PROGRESS');
      expect(result.status).toBe('IN_PROGRESS');
    });

    it('rejects invalid transition NEW -> DONE', async () => {
      prisma.extension.findUnique.mockResolvedValue({ id: '1', status: 'NEW' });
      await expect(service.updateStatus('1', 'DONE')).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete', () => {
    it('deletes when found', async () => {
      prisma.extension.findUnique.mockResolvedValue({ id: '1' });
      await service.delete('1');
      expect(prisma.extension.delete).toHaveBeenCalled();
    });
  });
});
