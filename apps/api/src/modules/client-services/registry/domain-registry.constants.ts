export const REGISTRY_LOOKUP_TIMEOUT_MS = 8_000;
export const WHOIS_QUERY_GAP_MS = 500;
export const CRON_MAX_LOOKUPS_PER_RUN = 80;
export const REGISTRY_SNAPSHOT_TTL_HOURS = 24;
/** Manual "check all": rows loaded per request; the time budget usually ends the page first. */
export const BULK_CHECK_PAGE_SIZE = 60;
/** No new lookup starts after this; in-flight ones finish (WHOIS + RDAP fallback ≤ 16 s). */
export const BULK_CHECK_TIME_BUDGET_MS = 15_000;
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
