import { describe, expect, it } from 'vitest';
import { parseArmeniaCompanyLookupQuery } from './armenia-company-lookup.query';

describe('parseArmeniaCompanyLookupQuery', () => {
  it('parses an 8-digit TIN with spaces', () => {
    expect(parseArmeniaCompanyLookupQuery(' 0016 1665 ')).toEqual({
      kind: 'tin',
      value: '00161665',
    });
  });

  it('parses a company name', () => {
    expect(parseArmeniaCompanyLookupQuery('ԷՎՈԼՎԵՐ')).toEqual({
      kind: 'name',
      value: 'ԷՎՈԼՎԵՐ',
    });
  });

  it('parses an all-zero TIN as TIN format and leaves exact-match filtering to the mapper', () => {
    expect(parseArmeniaCompanyLookupQuery('00000000')).toEqual({
      kind: 'tin',
      value: '00000000',
    });
    expect(parseArmeniaCompanyLookupQuery('123')).toBeNull();
    expect(parseArmeniaCompanyLookupQuery('12')).toBeNull();
  });
});
