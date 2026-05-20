/** Open client service detail sheet on `/finance/client-services` with this query. */
export const OPEN_CLIENT_SERVICE_QUERY = 'openClientService' as const;

export function clientServicesListWithOpenServiceHref(serviceId: string): string {
  return `/finance/client-services?${OPEN_CLIENT_SERVICE_QUERY}=${encodeURIComponent(serviceId)}`;
}
