import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { DEPRECATED_PATCH_STATUS_TERMINAL_AUDIT_ACTION } from '../delivery-status-deprecation';
import {
  createProductsServiceHarness,
  clearProductsServiceHarness,
  type ProductsServiceHarness,
  readExceptionResponse,
} from './products.service.test-harness';

vi.mock('../../bonus/product-bonus-pool-sync', () => ({
  syncProductBonusPoolForOrder: vi.fn().mockResolvedValue(undefined),
}));

describe('ProductsService', () => {
  let service: ProductsServiceHarness['service'];
  let prisma: ProductsServiceHarness['prisma'];
  let auditService: ProductsServiceHarness['auditService'];

  beforeEach(() => {
    const harness = createProductsServiceHarness();
    clearProductsServiceHarness(harness);
    service = harness.service;
    prisma = harness.prisma;
    auditService = harness.auditService;
  });

  describe('updateStatus — stage gate', () => {
    it('requires description, deadline, and order for NEW → CREATING', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        status: 'NEW',
        description: null,
        deadline: null,
        order: null,
      });

      await expect(service.updateStatus('p1', 'CREATING', 'emp-audit')).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it('allows NEW → CREATING', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        status: 'NEW',
        description: 'Website scope',
        deadline: new Date('2026-06-01'),
        order: { id: 'ord-1' },
      });
      prisma.product.update.mockResolvedValue({ id: 'p1', status: 'CREATING' });
      const result = await service.updateStatus('p1', 'CREATING', 'emp-audit');
      expect(result.status).toBe('CREATING');
    });

    it('blocks DEVELOPMENT → QA when product tasks are still open', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        status: 'DEVELOPMENT',
        tasks: [{ status: 'IN_PROGRESS' }, { status: 'DONE' }],
      });

      const error = await service
        .updateStatus('p1', 'QA', 'emp-audit')
        .catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(BadRequestException);
      expect(readExceptionResponse(error)).toMatchObject({
        code: 'STAGE_GATE_VALIDATION',
        errors: [{ field: 'tasks', message: expect.any(String) }],
      });
      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it('allows DEVELOPMENT → QA when product tasks are closed', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        status: 'DEVELOPMENT',
        tasks: [{ status: 'DONE' }, { status: 'ON_HOLD' }],
      });
      prisma.product.update.mockResolvedValue({ id: 'p1', status: 'QA' });
      const result = await service.updateStatus('p1', 'QA', 'emp-audit');
      expect(result.status).toBe('QA');
    });

    it('blocks QA → TRANSFER when QA tasks are still open', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        status: 'QA',
        tasks: [{ status: 'IN_PROGRESS' }, { status: 'DONE' }],
      });

      const error = await service
        .updateStatus('p1', 'TRANSFER', 'emp-audit')
        .catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(BadRequestException);
      expect(readExceptionResponse(error)).toMatchObject({
        code: 'STAGE_GATE_VALIDATION',
        errors: [{ field: 'tasks', message: expect.any(String) }],
      });
      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it('allows QA → TRANSFER when QA tasks are closed', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        status: 'QA',
        tasks: [{ status: 'DONE' }, { status: 'COMPLETED' }],
      });
      prisma.product.update.mockResolvedValue({ id: 'p1', status: 'TRANSFER' });
      const result = await service.updateStatus('p1', 'TRANSFER', 'emp-audit');
      expect(result.status).toBe('TRANSFER');
    });

    it('rejects DONE → CREATING (terminal state)', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'p1', status: 'DONE' });
      await expect(service.updateStatus('p1', 'CREATING', 'emp-audit')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects NEW → QA (skip not allowed)', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'p1', status: 'NEW' });
      await expect(service.updateStatus('p1', 'QA', 'emp-audit')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('allows any → LOST', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        projectId: 'proj-1',
        status: 'DEVELOPMENT',
      });
      prisma.product.update.mockResolvedValue({ id: 'p1', status: 'LOST' });
      const result = await service.updateStatus('p1', 'LOST', 'emp-audit');
      expect(result.status).toBe('LOST');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: DEPRECATED_PATCH_STATUS_TERMINAL_AUDIT_ACTION,
          entityType: 'PRODUCT',
          entityId: 'p1',
          userId: 'emp-audit',
          projectId: 'proj-1',
          changes: expect.objectContaining({
            deprecatedApiPath: 'PATCH /projects/products/:id/status',
            targetStatus: 'LOST',
            deliveryResolution: 'CANCELLED',
          }),
        }),
      );
    });

    it('allows ON_HOLD → back to any active stage', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        projectId: 'proj-1',
        status: 'ON_HOLD',
        deadline: new Date('2026-05-20T00:00:00.000Z'),
      });
      prisma.product.update.mockResolvedValue({ id: 'p1', status: 'DEVELOPMENT' });
      const result = await service.updateStatus('p1', 'DEVELOPMENT', 'emp-audit');
      expect(result.status).toBe('DEVELOPMENT');
    });

    it('blocks TRANSFER → DONE when delivery items are still open', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        status: 'TRANSFER',
        clientAcceptedAt: new Date('2026-04-29T09:00:00.000Z'),
        extensions: [{ status: 'DEVELOPMENT' }],
        tasks: [{ status: 'IN_PROGRESS' }],
        tickets: [{ status: 'NEW' }],
      });

      const error = await service
        .updateStatus('p1', 'DONE', 'emp-audit')
        .catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(BadRequestException);
      expect(readExceptionResponse(error)).toMatchObject({
        code: 'STAGE_GATE_VALIDATION',
        errors: [
          { field: 'extensions', message: expect.any(String) },
          { field: 'tasks', message: expect.any(String) },
          { field: 'tickets', message: expect.any(String) },
        ],
      });
      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it('blocks TRANSFER → DONE when order invoices are unpaid', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        status: 'TRANSFER',
        clientAcceptedAt: new Date('2026-04-29T09:00:00.000Z'),
        extensions: [{ status: 'DONE' }],
        tasks: [{ status: 'DONE' }],
        tickets: [{ status: 'RESOLVED' }],
        order: {
          id: 'ord-1',
          status: 'FULLY_PAID',
          paymentType: 'CLASSIC',
          invoices: [{ moneyStatus: 'PAID' }, { moneyStatus: 'AWAITING_PAYMENT' }],
        },
      });

      const error = await service
        .updateStatus('p1', 'DONE', 'emp-audit')
        .catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(BadRequestException);
      expect(readExceptionResponse(error)).toMatchObject({
        code: 'STAGE_GATE_VALIDATION',
        errors: [{ field: 'finance', message: expect.any(String) }],
      });
      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it('blocks TRANSFER → DONE when linked CLASSIC order is not fully paid', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        status: 'TRANSFER',
        clientAcceptedAt: new Date('2026-04-29T09:00:00.000Z'),
        extensions: [{ status: 'DONE' }],
        tasks: [{ status: 'DONE' }],
        tickets: [{ status: 'RESOLVED' }],
        order: {
          id: 'ord-1',
          status: 'PARTIALLY_PAID',
          paymentType: 'CLASSIC',
          invoices: [{ moneyStatus: 'PAID' }],
        },
      });

      const error = await service
        .updateStatus('p1', 'DONE', 'emp-audit')
        .catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(BadRequestException);
      expect(readExceptionResponse(error)).toMatchObject({
        code: 'STAGE_GATE_VALIDATION',
        errors: [{ field: 'finance', message: expect.any(String) }],
      });
      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it('regression: allows TRANSFER → DONE when a subscription order is PARTIALLY_PAID and no invoices are unpaid', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        projectId: 'proj-1',
        status: 'TRANSFER',
        clientAcceptedAt: new Date('2026-04-29T09:00:00.000Z'),
        extensions: [{ status: 'DONE' }],
        tasks: [{ status: 'DONE' }],
        tickets: [{ status: 'RESOLVED' }],
        order: {
          id: 'ord-1',
          status: 'PARTIALLY_PAID',
          paymentType: 'SUBSCRIPTION',
          invoices: [{ moneyStatus: 'PAID' }],
        },
      });
      prisma.product.update.mockResolvedValue({ id: 'p1', status: 'DONE' });

      const result = await service.updateStatus('p1', 'DONE', 'emp-audit');

      expect(result.status).toBe('DONE');
      expect(prisma.product.update).toHaveBeenCalled();
    });
  });
});
