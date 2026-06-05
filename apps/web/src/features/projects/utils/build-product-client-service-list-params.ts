import {
  CLIENT_SERVICE_FILTER_BILLING_KEY,
  CLIENT_SERVICE_FILTER_STATUS_KEY,
  CLIENT_SERVICE_FILTER_TYPE_KEY,
} from '@/features/finance/components/client-services/build-client-service-integrated-filter-configs';
import type { ClientServiceRecordListParams } from '@/lib/api/client-services';

export function buildProductClientServiceListParams(
  projectId: string,
  search: string,
  filters: Record<string, string>,
): ClientServiceRecordListParams {
  const type = filters[CLIENT_SERVICE_FILTER_TYPE_KEY];
  const status = filters[CLIENT_SERVICE_FILTER_STATUS_KEY];
  const billing = filters[CLIENT_SERVICE_FILTER_BILLING_KEY];

  return {
    projectId,
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(type && type !== 'all' ? { type } : {}),
    ...(status && status !== 'all' ? { status } : {}),
    ...(billing && billing !== 'all' ? { billingModel: billing } : {}),
  };
}
