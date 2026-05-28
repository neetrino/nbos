import { describe, expect, it } from 'vitest';
import {
  rollupUnitEconomicsByProduct,
  rollupUnitEconomicsByProject,
} from './unit-economics-rollups';
import type { UnitEconomicsRowDto } from './unit-economics.types';

function row(
  partial: Partial<UnitEconomicsRowDto> & Pick<UnitEconomicsRowDto, 'orderId'>,
): UnitEconomicsRowDto {
  return {
    orderId: partial.orderId,
    orderCode: partial.orderCode ?? partial.orderId,
    label: partial.label ?? 'Unit',
    projectId: partial.projectId ?? 'p1',
    projectCode: partial.projectCode ?? 'PRJ',
    projectName: partial.projectName ?? 'Project',
    productId: partial.productId ?? null,
    extensionId: partial.extensionId ?? null,
    productLabel: partial.productLabel ?? 'Product A',
    orderType: partial.orderType ?? 'PRODUCT',
    deliveryOpen: partial.deliveryOpen ?? true,
    invoicedAmount: partial.invoicedAmount ?? '100.00',
    receivedAmount: partial.receivedAmount ?? '50.00',
    receivableAmount: partial.receivableAmount ?? '50.00',
    expensesPaidAmount: partial.expensesPaidAmount ?? '10.00',
    plannedBonuses: partial.plannedBonuses ?? '5.00',
    releasedBonuses: partial.releasedBonuses ?? '0.00',
    paidBonuses: partial.paidBonuses ?? '0.00',
    remainingBonuses: partial.remainingBonuses ?? '5.00',
    cashBalance: partial.cashBalance ?? '35.00',
    outFactAmount: partial.outFactAmount ?? '15.00',
    outCommittedAmount: partial.outCommittedAmount ?? '20.00',
    marginFact: partial.marginFact ?? '35.00',
    marginAfterCommitments: partial.marginAfterCommitments ?? '30.00',
    overReleaseAmount: partial.overReleaseAmount ?? '0.00',
  };
}

describe('rollupUnitEconomicsByProject', () => {
  it('sums money fields per project', () => {
    const items = [
      row({ orderId: 'o1', projectId: 'p1', receivedAmount: '100.00', cashBalance: '80.00' }),
      row({ orderId: 'o2', projectId: 'p1', receivedAmount: '50.00', cashBalance: '20.00' }),
      row({ orderId: 'o3', projectId: 'p2', projectCode: 'B', receivedAmount: '10.00' }),
    ];
    const projects = rollupUnitEconomicsByProject(items);
    expect(projects).toHaveLength(2);
    const p1 = projects.find((p) => p.projectId === 'p1');
    expect(p1?.unitCount).toBe(2);
    expect(p1?.receivedAmount).toBe('150.00');
    expect(p1?.cashBalance).toBe('100.00');
  });
});

describe('rollupUnitEconomicsByProduct', () => {
  it('groups by product id when present', () => {
    const items = [
      row({
        orderId: 'o1',
        productId: 'prod-1',
        receivedAmount: '40.00',
        marginAfterCommitments: '10.00',
      }),
      row({
        orderId: 'o2',
        productId: 'prod-1',
        receivedAmount: '60.00',
        marginAfterCommitments: '20.00',
      }),
    ];
    const products = rollupUnitEconomicsByProduct(items);
    expect(products).toHaveLength(1);
    expect(products[0]?.kind).toBe('PRODUCT');
    expect(products[0]?.receivedAmount).toBe('100.00');
    expect(products[0]?.marginAfterCommitments).toBe('30.00');
  });
});
