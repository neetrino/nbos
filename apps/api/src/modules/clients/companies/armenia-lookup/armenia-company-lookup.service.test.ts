import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServiceUnavailableException } from '@nestjs/common';
import { ArmeniaCompanyLookupService } from './armenia-company-lookup.service';
import type { ArmeniaCompanyLookupClient } from './armenia-company-lookup.client';
import { ARMENIA_COMPANY_LOOKUP_ERROR } from './armenia-company-lookup.constants';
import type { SrcTaxpayerSearchRow } from './armenia-company-lookup.types';

const SRC_ROW: SrcTaxpayerSearchRow = {
  tin: '00161665',
  name: '«ԷՎՈԼՎԵՐ»',
  address: 'ԵՐԵՎԱՆ',
  legalStatus: 'ՍՊԸ',
  submitDate: '2017-01-11',
  status: 'Գործող',
  entType: 'S96.09.0',
};

describe('ArmeniaCompanyLookupService', () => {
  const client = {
    isEnabled: vi.fn(),
    searchRows: vi.fn(),
  };
  let service: ArmeniaCompanyLookupService;

  beforeEach(() => {
    client.isEnabled.mockReturnValue(true);
    client.searchRows.mockReset();
    service = new ArmeniaCompanyLookupService(client as unknown as ArmeniaCompanyLookupClient);
  });

  it('returns exact TIN matches only', async () => {
    client.searchRows.mockResolvedValue([SRC_ROW, { ...SRC_ROW, tin: '20379941' }]);
    const result = await service.search('00161665');
    expect(result.queryKind).toBe('tin');
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.tin).toBe('00161665');
  });

  it('returns name matches without requiring a TIN', async () => {
    client.searchRows.mockResolvedValue([SRC_ROW]);
    const result = await service.search('Evolver');
    expect(result.queryKind).toBe('name');
    expect(result.items[0]?.name).toBe('«ԷՎՈԼՎԵՐ»');
  });

  it('does not throw when the registry has no match', async () => {
    client.searchRows.mockResolvedValue([]);
    await expect(service.search('99999999')).resolves.toEqual({ queryKind: 'tin', items: [] });
  });

  it('fails closed when lookup is disabled', async () => {
    client.isEnabled.mockReturnValue(false);
    await expect(service.search('00161665')).rejects.toBeInstanceOf(ServiceUnavailableException);
    try {
      await service.search('00161665');
    } catch (error) {
      const response = (error as ServiceUnavailableException).getResponse();
      expect(response).toMatchObject({ code: ARMENIA_COMPANY_LOOKUP_ERROR.UNAVAILABLE });
    }
    expect(client.searchRows).not.toHaveBeenCalled();
  });
});
