import { describe, expect, it } from 'vitest';
import {
  extensionBillingCompanyWhere,
  productBillingCompanyWhere,
  resolveProductBillingCompanyId,
} from './product-billing-company.where';

describe('resolveProductBillingCompanyId', () => {
  it('prefers the product company', () => {
    expect(resolveProductBillingCompanyId('co-product', 'co-project')).toBe('co-product');
  });

  it('falls back to the project company', () => {
    expect(resolveProductBillingCompanyId(null, 'co-project')).toBe('co-project');
  });
});

describe('productBillingCompanyWhere', () => {
  it('matches product company or project default when product company is empty', () => {
    expect(productBillingCompanyWhere('co-1')).toEqual({
      OR: [{ companyId: 'co-1' }, { companyId: null, project: { is: { companyId: 'co-1' } } }],
    });
  });
});

describe('extensionBillingCompanyWhere', () => {
  it('matches parent product company then project default', () => {
    expect(extensionBillingCompanyWhere('co-1')).toEqual({
      OR: [
        { product: { is: { companyId: 'co-1' } } },
        { product: { is: { companyId: null } }, project: { is: { companyId: 'co-1' } } },
      ],
    });
  });
});
