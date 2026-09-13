import { describe, expect, it } from 'vitest';
import type { DeliveryBoardTranslate } from '@/features/projects/components/delivery-board/delivery-board-message-keys';
import type { ProjectProductSummary } from '@/lib/api/projects';
import { getProductDirectoryBadge } from './products-hub-directory-badge';

function product(partial: Partial<ProjectProductSummary>): ProjectProductSummary {
  return {
    id: 'p1',
    name: 'Site',
    status: 'DEVELOPMENT',
    productCategory: 'CODE',
    productType: 'COMPANY_WEBSITE',
    deadline: null,
    pm: null,
    _count: { extensions: 0, tasks: 0, tickets: 0 },
    ...partial,
  };
}

const t = ((key: string) => key) as unknown as DeliveryBoardTranslate;

describe('getProductDirectoryBadge', () => {
  it('labels maintenance and closed buckets', () => {
    expect(getProductDirectoryBadge(product({ hubView: 'maintenance' }), t)).toEqual({
      label: 'hub.maintenance',
      variant: 'green',
    });
    expect(
      getProductDirectoryBadge(
        product({
          hubView: 'closed',
          status: 'DONE',
          deliveryLifecycle: {
            entityKind: 'PRODUCT',
            legacyStatus: 'DONE',
            stage: 'TRANSFER',
            workStatus: 'ACTIVE',
            resolution: 'DONE',
            onHoldReason: null,
            onHoldUntil: null,
            cancellationReason: null,
            isActive: false,
            isTerminal: true,
          },
        }),
        t,
      ),
    ).toEqual({ label: 'resolution.done', variant: 'green' });
  });
});
