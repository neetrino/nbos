import type { Lead } from '@/lib/api/leads';
import type { Deal } from '@/lib/api/deals';

type AttributionEntity = Pick<
  Lead | Deal,
  'source' | 'sourceDetail' | 'marketingAccount' | 'marketingActivity'
>;

export function formatMarketingChannelLabel(entity: AttributionEntity): string | null {
  if (entity.source === 'MARKETING' && entity.marketingAccount?.name) {
    return entity.marketingAccount.name;
  }
  if (entity.source === 'MARKETING' && entity.marketingActivity?.title) {
    return entity.marketingActivity.title;
  }
  if (entity.sourceDetail) {
    return entity.sourceDetail.replace(/_/g, ' ');
  }
  return null;
}
