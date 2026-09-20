import { describe, expect, it, vi } from 'vitest';
import { DeliveryCompensationRulesService } from './delivery-compensation-rules.service';

describe('DeliveryCompensationRulesService enrollment switch', () => {
  it('reads the switch as off when no setting row exists yet', async () => {
    const service = new DeliveryCompensationRulesService({
      deliveryCompensationRuntimeSetting: { findUnique: vi.fn().mockResolvedValue(null) },
    } as never);

    await expect(service.getEnrollmentSetting()).resolves.toEqual({
      newEnrollmentEnabled: false,
      updatedAt: null,
    });
  });

  it('reads the stored switch with its timestamp', async () => {
    const service = new DeliveryCompensationRulesService({
      deliveryCompensationRuntimeSetting: {
        findUnique: vi.fn().mockResolvedValue({
          newEnrollmentEnabled: true,
          updatedAt: new Date('2026-09-20T00:00:00.000Z'),
        }),
      },
    } as never);

    await expect(service.getEnrollmentSetting()).resolves.toEqual({
      newEnrollmentEnabled: true,
      updatedAt: '2026-09-20T00:00:00.000Z',
    });
  });

  it('creates the row on first write and keeps the requested value', async () => {
    const upsert = vi.fn().mockResolvedValue({
      newEnrollmentEnabled: true,
      updatedAt: new Date('2026-09-20T01:00:00.000Z'),
    });
    const service = new DeliveryCompensationRulesService({
      deliveryCompensationRuntimeSetting: { upsert },
    } as never);

    await expect(service.setEnrollmentSetting(true)).resolves.toEqual({
      newEnrollmentEnabled: true,
      updatedAt: '2026-09-20T01:00:00.000Z',
    });
    expect(upsert).toHaveBeenCalledWith({
      where: { id: 'default' },
      create: { id: 'default', newEnrollmentEnabled: true },
      update: { newEnrollmentEnabled: true },
    });
  });
});
