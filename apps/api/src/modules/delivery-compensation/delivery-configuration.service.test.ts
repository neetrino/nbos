import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { DeliveryConfigurationService } from './delivery-configuration.service';

describe('DeliveryConfigurationService', () => {
  it('returns implicit LEGACY without creating BonusEntry', async () => {
    const service = new DeliveryConfigurationService({
      deliveryConfiguration: { findFirst: vi.fn().mockResolvedValue(null) },
    } as never);
    await expect(service.getByProduct('11111111-1111-1111-1111-111111111111')).resolves.toEqual({
      mode: 'LEGACY',
    });
  });

  it('blocks V2 enrollment while the readiness switch is off', async () => {
    const service = new DeliveryConfigurationService({
      deliveryCompensationRuntimeSetting: {
        findUnique: vi.fn().mockResolvedValue({ id: 'default', newEnrollmentEnabled: false }),
      },
      deliveryConfiguration: { findFirst: vi.fn(), create: vi.fn() },
    } as never);
    await expect(
      service.enrollProduct('11111111-1111-1111-1111-111111111111', 'order-1'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects enrollment when the order belongs to another product', async () => {
    const service = new DeliveryConfigurationService({
      deliveryCompensationRuntimeSetting: {
        findUnique: vi.fn().mockResolvedValue({ id: 'default', newEnrollmentEnabled: true }),
      },
      deliveryConfiguration: { findFirst: vi.fn().mockResolvedValue(null), create: vi.fn() },
      product: {
        findUnique: vi
          .fn()
          .mockResolvedValue({ status: 'DEVELOPMENT', deliveryResolution: null, closedAt: null }),
      },
      order: {
        findUnique: vi
          .fn()
          .mockResolvedValue({ productId: '22222222-2222-2222-2222-222222222222' }),
      },
    } as never);
    await expect(
      service.enrollProduct('11111111-1111-1111-1111-111111111111', 'order-other'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects enrollment when the order does not exist', async () => {
    const service = new DeliveryConfigurationService({
      deliveryCompensationRuntimeSetting: {
        findUnique: vi.fn().mockResolvedValue({ id: 'default', newEnrollmentEnabled: true }),
      },
      deliveryConfiguration: { findFirst: vi.fn().mockResolvedValue(null), create: vi.fn() },
      product: {
        findUnique: vi
          .fn()
          .mockResolvedValue({ status: 'DEVELOPMENT', deliveryResolution: null, closedAt: null }),
      },
      order: { findUnique: vi.fn().mockResolvedValue(null) },
    } as never);
    await expect(
      service.enrollProduct('11111111-1111-1111-1111-111111111111', 'missing-order'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('refuses enrollment when the order already has BonusEntry rows', async () => {
    const service = new DeliveryConfigurationService({
      deliveryCompensationRuntimeSetting: {
        findUnique: vi.fn().mockResolvedValue({ id: 'default', newEnrollmentEnabled: true }),
      },
      deliveryConfiguration: { findFirst: vi.fn().mockResolvedValue(null), create: vi.fn() },
      product: {
        findUnique: vi
          .fn()
          .mockResolvedValue({ status: 'DEVELOPMENT', deliveryResolution: null, closedAt: null }),
      },
      order: {
        findUnique: vi
          .fn()
          .mockResolvedValue({ productId: '11111111-1111-1111-1111-111111111111' }),
      },
      bonusEntry: { count: vi.fn().mockResolvedValue(2) },
    } as never);
    await expect(
      service.enrollProduct('11111111-1111-1111-1111-111111111111', 'order-1'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('refuses to enrol a card that was already closed once', async () => {
    const create = vi.fn();
    const service = new DeliveryConfigurationService({
      deliveryCompensationRuntimeSetting: {
        findUnique: vi.fn().mockResolvedValue({ id: 'default', newEnrollmentEnabled: true }),
      },
      deliveryConfiguration: { findFirst: vi.fn().mockResolvedValue(null), create },
      product: {
        findUnique: vi.fn().mockResolvedValue({
          status: 'DEVELOPMENT',
          deliveryResolution: null,
          closedAt: new Date('2026-09-01T00:00:00Z'),
        }),
      },
    } as never);

    await expect(
      service.enrollProduct('11111111-1111-1111-1111-111111111111', 'order-1'),
    ).rejects.toMatchObject({ response: { code: 'FINANCIAL_ALLOCATION_LOCKED' } });
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects draft catalog functions from the picker', async () => {
    const service = new DeliveryConfigurationService({
      deliveryConfiguration: {
        findUnique: vi
          .fn()
          .mockResolvedValue({ product: { status: 'DEVELOPMENT' }, extension: null }),
      },
      deliveryFunction: { findUnique: vi.fn().mockResolvedValue({ id: 'fn-1', status: 'DRAFT' }) },
    } as never);
    await expect(service.addFeature('cfg-1', 'fn-1')).rejects.toBeInstanceOf(BadRequestException);
  });
});
