import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ARMENIA_COMPANY_LOOKUP_ENABLED_ENV,
  ARMENIA_SRC_BASE_URL_ENV,
  SRC_LOOKUP_ALLOWED_HOSTS,
  SRC_LOOKUP_ORIGIN,
  SRC_LOOKUP_PAGE_SIZE,
  SRC_LOOKUP_SEARCH_PATH,
  SRC_LOOKUP_SESSION_PATH,
  SRC_LOOKUP_TIMEOUT_MS,
  SRC_LOOKUP_USER_AGENT,
} from './armenia-company-lookup.constants';
import { parseSrcSetCookieHeaders } from './armenia-company-lookup.cookies';
import { lookupUnavailable } from './armenia-company-lookup.errors';
import { parseSrcTaxpayerRows } from './armenia-company-lookup.mapper';
import type {
  ArmeniaCompanyLookupQuery,
  SrcTaxpayerSearchRow,
} from './armenia-company-lookup.types';

@Injectable()
export class ArmeniaCompanyLookupClient {
  private readonly logger = new Logger(ArmeniaCompanyLookupClient.name);

  constructor(private readonly config: ConfigService) {}

  isEnabled(): boolean {
    const raw = this.config.get<string>(ARMENIA_COMPANY_LOOKUP_ENABLED_ENV)?.trim().toLowerCase();
    return raw !== 'false' && raw !== '0';
  }

  async searchRows(query: ArmeniaCompanyLookupQuery): Promise<SrcTaxpayerSearchRow[]> {
    const origin = this.resolveOrigin();
    const session = await this.fetchSession(origin);
    return this.fetchRows(origin, session, query);
  }

  private resolveOrigin(): string {
    const raw = this.config.get<string>(ARMENIA_SRC_BASE_URL_ENV)?.trim() || SRC_LOOKUP_ORIGIN;
    let parsed: URL;
    try {
      parsed = new URL(raw);
    } catch {
      throw lookupUnavailable('Armenian registry is not configured.');
    }
    if (parsed.protocol !== 'https:' || !isAllowedSrcHost(parsed.hostname)) {
      throw lookupUnavailable('Armenian registry is not configured.');
    }
    return parsed.origin;
  }

  private async fetchSession(origin: string): Promise<{ cookieHeader: string; csrfToken: string }> {
    const response = await this.request(`${origin}${SRC_LOOKUP_SESSION_PATH}`, {
      headers: { Accept: 'text/html', 'User-Agent': SRC_LOOKUP_USER_AGENT },
    });
    const cookies = parseSrcSetCookieHeaders(response.headers.getSetCookie());
    if (!cookies) {
      this.logger.warn({ event: 'armenia_company_lookup_csrf_missing' });
      throw lookupUnavailable('Armenian registry is unavailable. Fill the form manually.');
    }
    return cookies;
  }

  private async fetchRows(
    origin: string,
    session: { cookieHeader: string; csrfToken: string },
    query: ArmeniaCompanyLookupQuery,
  ): Promise<SrcTaxpayerSearchRow[]> {
    const url = `${origin}${SRC_LOOKUP_SEARCH_PATH}?page=1`;
    const response = await this.request(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-XSRF-TOKEN': session.csrfToken,
        Cookie: session.cookieHeader,
        Origin: origin,
        Referer: `${origin}${SRC_LOOKUP_SESSION_PATH}`,
        'User-Agent': SRC_LOOKUP_USER_AGENT,
      },
      body: JSON.stringify(buildSrcSearchBody(query)),
    });
    const payload: unknown = await readJson(response);
    const rows = parseSrcTaxpayerRows(payload);
    if (!rows) {
      this.logger.warn({ event: 'armenia_company_lookup_malformed' });
      throw lookupUnavailable('Armenian registry returned an unexpected response.');
    }
    return rows;
  }

  private async request(url: string, init: RequestInit): Promise<Response> {
    let response: Response;
    try {
      response = await fetch(url, {
        ...init,
        redirect: 'follow',
        signal: AbortSignal.timeout(SRC_LOOKUP_TIMEOUT_MS),
      });
    } catch (error) {
      this.logger.warn({ event: 'armenia_company_lookup_network', error: String(error) });
      throw lookupUnavailable('Armenian registry is unavailable. Fill the form manually.');
    }
    if (!response.ok) {
      this.logger.warn({ event: 'armenia_company_lookup_http', status: response.status });
      throw lookupUnavailable('Armenian registry is unavailable. Fill the form manually.');
    }
    return response;
  }
}

function isAllowedSrcHost(hostname: string): boolean {
  return (SRC_LOOKUP_ALLOWED_HOSTS as readonly string[]).includes(hostname.toLowerCase());
}

function buildSrcSearchBody(query: ArmeniaCompanyLookupQuery): Record<string, string | number> {
  return {
    tin: query.kind === 'tin' ? query.value : '',
    name: query.kind === 'name' ? query.value : '',
    address: '',
    submitDate: '',
    status: '',
    legalStatus: '',
    entType: '',
    ModeTaxation: '',
    billingDate: '',
    currentPage: 1,
    perPage: SRC_LOOKUP_PAGE_SIZE,
  };
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw lookupUnavailable('Armenian registry returned an unexpected response.');
  }
}
