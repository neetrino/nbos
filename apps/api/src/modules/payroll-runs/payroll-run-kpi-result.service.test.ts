import { Decimal } from '@nbos/database';
import { describe, expect, it, vi } from 'vitest';
import { PayrollRunKpiResultService } from './payroll-run-kpi-result.service';

function createPrismaMock() {
  return {
    payrollRun: {
      findUnique: vi.fn(),
    },
    compensationProfile: {
      findFirst: vi.fn(),
    },
    kpiPolicy: {
      findFirst: vi.fn(),
    },
    payment: {
      findMany: vi.fn(),
    },
    kpiResult: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
  };
}

describe('PayrollRunKpiResultService', () => {
  it('syncs sales KPI result source facts for employees with an active KPI policy', async () => {
    const prisma = createPrismaMock();
    prisma.payrollRun.findUnique
      .mockResolvedValueOnce({
        id: 'run1',
        payrollMonth: '2026-05',
        salaryLines: [
          { id: 'line1', employeeId: 'e1', compensationProfileId: 'cp1' },
          { id: 'line2', employeeId: 'e2', compensationProfileId: null },
        ],
      })
      .mockResolvedValueOnce({ id: 'run1', payrollMonth: '2026-05' });
    prisma.compensationProfile.findFirst
      .mockResolvedValueOnce({
        id: 'cp1',
        baseSalary: new Decimal(1000),
        currency: 'AMD',
        kpiPolicyId: 'kp1',
      })
      .mockResolvedValueOnce(null);
    prisma.kpiPolicy.findFirst.mockResolvedValue({
      id: 'kp1',
      gateRules: { bands: [{ minAttainmentPct: 70, payoutFactor: 1 }] },
      targetAmount: new Decimal(500),
      targetSource: 'MANUAL_POLICY',
      resultSource: 'SALES_PAYMENTS',
    });
    prisma.payment.findMany.mockResolvedValue([
      {
        id: 'pay1',
        amount: new Decimal(300),
        paymentDate: new Date('2026-05-10T00:00:00.000Z'),
        invoice: {
          id: 'inv1',
          code: 'INV-1',
          order: { id: 'ord1', code: 'ORD-1', deal: { id: 'deal1', sellerId: 'e1' } },
        },
      },
    ]);
    prisma.kpiResult.upsert.mockResolvedValue({});
    prisma.kpiResult.findMany.mockResolvedValue([
      {
        id: 'kr1',
        employeeId: 'e1',
        period: '2026-05',
        kpiPolicyId: 'kp1',
        compensationProfileId: 'cp1',
        planAmount: null,
        actualAmount: new Decimal(300),
        attainmentPct: null,
        payoutFactor: new Decimal(1),
        source: 'SYSTEM',
        sourceFacts: { salesPayments: [] },
        employee: { firstName: 'Sam', lastName: 'Seller' },
      },
    ]);

    const service = new PayrollRunKpiResultService(prisma as never);
    const result = await service.syncSalesForPayrollRun('run1');

    expect(prisma.kpiResult.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.kpiResult.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          employeeId: 'e1',
          planAmount: new Decimal(500),
          actualAmount: new Decimal(300),
          attainmentPct: new Decimal(60),
          payoutFactor: new Decimal('0.0000'),
          sourceFacts: {
            targetSource: 'MANUAL_POLICY',
            resultSource: 'SALES_PAYMENTS',
            salesPayments: [
              expect.objectContaining({
                paymentId: 'pay1',
                amount: '300.00',
              }),
            ],
          },
        }),
      }),
    );
    expect(result.items[0]?.employeeName).toBe('Sam Seller');
  });
});
