import { describe, it, expect } from 'vitest';
import { productDeadlineProjection, extensionDeadlineProjection } from './calendar-projections';
import type { ProductDeadlineRow, ExtensionDeadlineRow } from './calendar-projections';

function baseProductRow(overrides: Partial<ProductDeadlineRow> = {}): ProductDeadlineRow {
  return {
    id: 'prod-1',
    name: 'Website',
    projectId: 'proj-1',
    deadline: new Date('2026-06-20T00:00:00.000Z'),
    deliveryWorkStatus: 'IN_PROGRESS',
    project: { id: 'proj-1', name: 'Acme' },
    pm: { firstName: 'Pat', lastName: 'Lee' },
    ...overrides,
  } as unknown as ProductDeadlineRow;
}

function baseExtensionRow(overrides: Partial<ExtensionDeadlineRow> = {}): ExtensionDeadlineRow {
  return {
    id: 'ext-1',
    name: 'Phase 2',
    projectId: 'proj-1',
    deadline: new Date('2026-06-22T00:00:00.000Z'),
    deliveryWorkStatus: 'IN_PROGRESS',
    project: { id: 'proj-1', name: 'Acme' },
    product: { name: 'Website' },
    assignee: { firstName: 'Alex', lastName: 'Kim' },
    ...overrides,
  } as unknown as ExtensionDeadlineRow;
}

describe('calendar-projections', () => {
  it('marks ON_HOLD delivery status on product projection', () => {
    const row = baseProductRow({ deliveryWorkStatus: 'ON_HOLD' });
    const p = productDeadlineProjection(row);
    expect(p.status).toBe('ON_HOLD');
    expect(p.badge).toBe('On Hold');
  });

  it('links product deadline to product card href', () => {
    const p = productDeadlineProjection(baseProductRow());
    expect(p.sourceHref).toBe('/projects/proj-1/products/prod-1');
    expect(p.layer).toBe('DELIVERY_DEADLINES');
  });

  it('links extension deadline to extension card href', () => {
    const p = extensionDeadlineProjection(baseExtensionRow());
    expect(p.sourceHref).toBe('/projects/proj-1/extensions/ext-1');
    expect(p.description).toContain('Website');
  });
});
