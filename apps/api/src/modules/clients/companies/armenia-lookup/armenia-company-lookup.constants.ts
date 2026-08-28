/** Public SRC taxpayer search used by https://www.src.am taxpayer search page. */
export const SRC_LOOKUP_ORIGIN = 'https://www.src.am';
export const SRC_LOOKUP_ALLOWED_HOSTS = ['www.src.am', 'src.am'] as const;
export const SRC_LOOKUP_SESSION_PATH = '/am/taxpayerSearchSystemPage/112';
export const SRC_LOOKUP_SEARCH_PATH = '/am/taxpayerSearchData';

export const SRC_LOOKUP_TIMEOUT_MS = 8_000;
export const SRC_LOOKUP_PAGE_SIZE = 10;
export const SRC_LOOKUP_QUERY_MIN_LENGTH = 2;
export const SRC_LOOKUP_QUERY_MAX_LENGTH = 200;
export const ARMENIA_TIN_LENGTH = 8;

export const ARMENIA_COUNTRY_NAME = 'Armenia';
export const SRC_ACTIVE_STATUS = 'Գործող';

export const ARMENIA_COMPANY_LOOKUP_ENABLED_ENV = 'ARMENIA_COMPANY_LOOKUP_ENABLED';
export const ARMENIA_SRC_BASE_URL_ENV = 'ARMENIA_SRC_BASE_URL';

export const ARMENIA_COMPANY_LOOKUP_ERROR = {
  QUERY_INVALID: 'COMPANY_LOOKUP_QUERY_INVALID',
  UNAVAILABLE: 'COMPANY_LOOKUP_UNAVAILABLE',
} as const;

export const SRC_LOOKUP_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
