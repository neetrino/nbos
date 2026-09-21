import { describe, expect, it } from 'vitest';
import { parseCollectionBody } from './collections-write';

const FUNCTION_A = '11111111-2222-3333-4444-555555555555';
const FUNCTION_B = '66666666-7777-8888-9999-aaaaaaaaaaaa';

describe('parseCollectionBody', () => {
  it('reads a named kit for one product kind', () => {
    expect(
      parseCollectionBody({
        productType: 'ECOMMERCE',
        name: 'Розница',
        functionIds: [FUNCTION_A, FUNCTION_B],
      }),
    ).toEqual({
      productType: 'ECOMMERCE',
      name: 'Розница',
      functionIds: [FUNCTION_A, FUNCTION_B],
    });
  });

  it('rejects an empty name and a bad product type', () => {
    expect(() =>
      parseCollectionBody({ productType: 'ECOMMERCE', name: '  ', functionIds: [] }),
    ).toThrow(/name is required/);
    expect(() =>
      parseCollectionBody({ productType: 'NOT_A_KIND', name: 'Kit', functionIds: [] }),
    ).toThrow(/productType is invalid/);
  });

  it('rejects duplicate function ids', () => {
    expect(() =>
      parseCollectionBody({
        productType: 'ECOMMERCE',
        name: 'Kit',
        functionIds: [FUNCTION_A, FUNCTION_A],
      }),
    ).toThrow(/duplicate/);
  });
});
