export const REGISTRY_LOOKUP_TIMEOUT_MS = 8_000;
export const WHOIS_QUERY_GAP_MS = 500;
export const CRON_MAX_LOOKUPS_PER_RUN = 80;
export const REGISTRY_SNAPSHOT_TTL_HOURS = 24;
/** Manual "check all": rows loaded per request; the time budget usually ends the page first. */
export const BULK_CHECK_PAGE_SIZE = 60;
/**
 * Per channel on a bulk page. WHOIS then RDAP is 8 s, short enough to finish inside
 * {@link BULK_CHECK_RESPONSE_DEADLINE_MS}.
 */
export const BULK_LOOKUP_TIMEOUT_MS = 4_000;
/** Stop starting lookups after this so the last one still fits in the response deadline. */
export const BULK_CHECK_TIME_BUDGET_MS = 2_000;
/**
 * Send the page by this time. The shared web client aborts at 15 s; this call uses a
 * longer timeout, and 12 s still leaves room for the database read.
 */
export const BULK_CHECK_RESPONSE_DEADLINE_MS = 12_000;
/** One socket per WHOIS host: registries such as whois.amnic.net throttle bursts. */
export const WHOIS_LANE_CONCURRENCY = 1;
export const RDAP_LANE_CONCURRENCY = 2;
export const RDAP_BOOTSTRAP_URL = 'https://rdap.org/domain';
export const WHOIS_PORT = 43;

export const WHOIS_HOST_BY_TLD: Readonly<Record<string, string>> = {
  am: 'whois.amnic.net',
  ge: 'whois.nic.ge',
  ru: 'whois.tcinet.ru',
  su: 'whois.tcinet.ru',
  nl: 'whois.sidn.nl',
  com: 'whois.verisign-grs.com',
  net: 'whois.verisign-grs.com',
  'de.com': 'whois.centralnic.com',
};

export const WHOIS_PREFERRED_TLDS = new Set(Object.keys(WHOIS_HOST_BY_TLD));
export const RDAP_ONLY_TLDS = new Set(['center']);

export const DOMAIN_FQDN_PATTERN =
  /^(?=.{1,253}$)(?!-)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.(?!-)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;
