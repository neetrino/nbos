import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectsService } from './projects.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { NotFoundException } from '@nestjs/common';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new ProjectsService(prisma as never);
  });

  describe('findAll', () => {
    it('returns paginated empty list', async () => {
      const result = await service.findAll({});
      expect(result.items).toEqual([]);
      expect(result.meta.totalPages).toBe(0);
    });
  });

  describe('findById', () => {
    it('throws NotFoundException', async () => {
      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });

    it('returns project with product-centric relations for overview consistency', async () => {
      prisma.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        code: 'P-2026-0001',
        products: [
          {
            id: 'prod-1',
            name: 'Website',
            status: 'DEVELOPMENT',
            _count: { extensions: 1, tasks: 3, tickets: 2 },
          },
        ],
        extensions: [
          {
            id: 'ext-1',
            name: 'Checkout improvements',
            status: 'QA',
            product: { id: 'prod-1', name: 'Website', productType: 'COMPANY_WEBSITE' },
            _count: { tasks: 2 },
          },
        ],
        _count: {
          products: 1,
          extensions: 1,
          orders: 0,
          tickets: 0,
          credentials: 0,
          expenses: 0,
        },
      });

      const result = await service.findById('proj-1');

      expect(result.products).toHaveLength(1);
      expect(result.extensions).toHaveLength(1);
      expect(result._count).toMatchObject({ products: 1, extensions: 1 });
      expect(prisma.project.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            products: expect.any(Object),
            extensions: expect.any(Object),
          }),
        }),
      );
    });
  });

  describe('create', () => {
    it('generates code P-YYYY-NNNN', async () => {
      prisma.project.create.mockResolvedValue({ id: '1', code: 'P-2026-0001' });
      const result = await service.create({ name: 'Test', contactId: 'c1' });
      expect(result.code).toMatch(/^P-\d{4}-\d{4}$/);
    });
  });

  describe('findAll (branch coverage)', () => {
    it('applies isArchived filter', async () => {
      await service.findAll({ isArchived: false });
      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isArchived: false }),
        }),
      );
    });

    it('applies search filter', async () => {
      await service.findAll({ search: 'test' });
      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ OR: expect.any(Array) }),
        }),
      );
    });

    it('uses custom sort', async () => {
      await service.findAll({ sortBy: 'name', sortOrder: 'asc' });
      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        }),
      );
    });
  });

  describe('create (branch coverage)', () => {
    it('creates project with name and contact', async () => {
      prisma.project.findFirst.mockResolvedValue(null);
      prisma.project.create.mockResolvedValue({ id: '1', code: 'P-2026-0001' });

      await service.create({ name: 'Test', contactId: 'c1' });
      expect(prisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'Test', contactId: 'c1' }),
        }),
      );
    });

    it('increments code from existing', async () => {
      prisma.project.findFirst.mockResolvedValue({ code: 'P-2026-0010' });
      prisma.project.create.mockImplementation(({ data }) => Promise.resolve({ id: '1', ...data }));

      const result = await service.create({ name: 'Test', contactId: 'c1' });
      expect(result.code).toBe('P-2026-0011');
    });
  });

  describe('update', () => {
    it('updates project fields', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: '1' });
      prisma.project.update.mockResolvedValue({ id: '1', name: 'Updated' });
      const result = await service.update('1', {
        name: 'Updated',
        description: 'Desc',
        isArchived: true,
        companyId: '',
      });
      expect(result.name).toBe('Updated');
    });
  });

  describe('delete', () => {
    it('deletes when found', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: '1' });
      await service.delete('1');
      expect(prisma.project.delete).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('returns stats', async () => {
      prisma.project.count.mockResolvedValue(3);
      const stats = await service.getStats();
      expect(stats.total).toBe(3);
    });
  });
});
