import { Injectable } from '@nestjs/common';
import { ArmeniaCompanyLookupClient } from './armenia-company-lookup.client';
import { lookupQueryInvalid, lookupUnavailable } from './armenia-company-lookup.errors';
import { filterExactTinMatches, mapSrcTaxpayerRow } from './armenia-company-lookup.mapper';
import { parseArmeniaCompanyLookupQuery } from './armenia-company-lookup.query';
import type { ArmeniaCompanyLookupResponse } from './armenia-company-lookup.types';

@Injectable()
export class ArmeniaCompanyLookupService {
  constructor(private readonly client: ArmeniaCompanyLookupClient) {}

  async search(rawQuery: string): Promise<ArmeniaCompanyLookupResponse> {
    const query = parseArmeniaCompanyLookupQuery(rawQuery);
    if (!query) throw lookupQueryInvalid();
    if (!this.client.isEnabled()) {
      throw lookupUnavailable('Armenian company lookup is turned off.');
    }

    const rows = await this.client.searchRows(query);
    const mapped = rows
      .map(mapSrcTaxpayerRow)
      .filter((item): item is NonNullable<typeof item> => item !== null);
    const items = query.kind === 'tin' ? filterExactTinMatches(mapped, query.value) : mapped;

    return { queryKind: query.kind, items };
  }
}
