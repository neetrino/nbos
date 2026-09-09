export const REGISTRY_LOOKUP_TIMEOUT_MS = 8_000;
export const WHOIS_QUERY_GAP_MS = 500;
export const CRON_MAX_LOOKUPS_PER_RUN = 80;
export const REGISTRY_SNAPSHOT_TTL_HOURS = 24;
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
