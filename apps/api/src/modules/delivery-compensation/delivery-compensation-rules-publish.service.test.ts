import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { DeliveryCompensationRulesPublishService } from './delivery-compensation-rules-publish.service';

describe('DeliveryCompensationRulesPublishService', () => {
  it('blocks publish when a required role still has null units', async () => {
    const service = new DeliveryCompensationRulesPublishService({
      $transaction: (fn: (tx: unknown) => Promise<unknown>) =>
        fn({
          deliveryFunctionPriceVersion: {
            findUnique: vi.fn().mockResolvedValue({
              id: 'pv-1',
              functionId: 'fn-1',
              status: 'DRAFT',
              roleUnits: [
                { roleKey: 'BACKEND', unitKind: 'REQUIRED', units: null },
                { roleKey: 'FRONTEND', unitKind: 'REQUIRED', units: '1' },
                { roleKey: 'PM', unitKind: 'REQUIRED', units: '1' },
                { roleKey: 'DESIGNER', unitKind: 'REQUIRED', units: '1' },
                { roleKey: 'QA', unitKind: 'REQUIRED', units: '1' },
                { roleKey: 'TECHNICAL_SPECIALIST', unitKind: 'REQUIRED', units: '1' },
              ],
            }),
            updateMany: vi.fn(),
            update: vi.fn(),
          },
        }),
    } as never);

    await expect(service.publishFunctionPrice('pv-1', 'emp-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('requires confirmation before publishing an explicit zero required vector', async () => {
    const service = new DeliveryCompensationRulesPublishService({
      $transaction: (fn: (tx: unknown) => Promise<unknown>) =>
        fn({
          deliveryFunctionPriceVersion: {
            findUnique: vi.fn().mockResolvedValue({
              id: 'pv-1',
              functionId: 'fn-1',
              status: 'DRAFT',
              roleUnits: [
                { roleKey: 'BACKEND', unitKind: 'REQUIRED', units: '0' },
                { roleKey: 'FRONTEND', unitKind: 'REQUIRED', units: '1' },
                { roleKey: 'PM', unitKind: 'REQUIRED', units: '1' },
                { roleKey: 'DESIGNER', unitKind: 'REQUIRED', units: '1' },
                { roleKey: 'QA', unitKind: 'REQUIRED', units: '1' },
                { roleKey: 'TECHNICAL_SPECIALIST', unitKind: 'REQUIRED', units: '1' },
              ],
            }),
            updateMany: vi.fn(),
            update: vi.fn(),
          },
        }),
    } as never);

    await expect(service.publishFunctionPrice('pv-1', 'emp-1')).rejects.toMatchObject({
      response: { message: 'ZERO_UNITS_CONFIRMATION_REQUIRED' },
    });
  });
});
