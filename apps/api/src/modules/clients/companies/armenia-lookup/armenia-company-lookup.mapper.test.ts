import { describe, expect, it } from 'vitest';
import {
  filterExactTinMatches,
  mapSrcTaxpayerRow,
  parseSrcTaxpayerRows,
} from './armenia-company-lookup.mapper';
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

describe('armenia company lookup mapper', () => {
  it('maps public SRC fields and drops incomplete rows', () => {
    const mapped = mapSrcTaxpayerRow(SRC_ROW);
    expect(mapped).toMatchObject({
      tin: '00161665',
      name: '«ԷՎՈԼՎԵՐ»',
      registeredAddress: 'ԵՐԵՎԱՆ',
      registrationDate: '2017-01-11',
      isActive: true,
      country: 'Armenia',
    });
    expect(mapSrcTaxpayerRow({ ...SRC_ROW, tin: '  ', name: 'X' })).toBeNull();
  });

  it('keeps only exact TIN matches after SRC search', () => {
    const wanted = mapSrcTaxpayerRow(SRC_ROW);
    const other = mapSrcTaxpayerRow({ ...SRC_ROW, tin: '20379941' });
    expect(wanted && other).toBeTruthy();
    if (!wanted || !other) return;
    expect(filterExactTinMatches([wanted, other], '00161665')).toEqual([wanted]);
  });

  it('rejects a malformed SRC payload', () => {
    expect(parseSrcTaxpayerRows({ data: [SRC_ROW] })).toEqual([SRC_ROW]);
    expect(parseSrcTaxpayerRows({ data: 'nope' })).toBeNull();
  });
});
