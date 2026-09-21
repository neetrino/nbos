import { describe, expect, it } from 'vitest';
import {
  buildDealExistingProductChangePatch,
  buildDealPlatformPatch,
  buildDealProjectChangePatch,
  buildDealTaxonomyPatch,
  buildDealTypeChangePatch,
  type DealGeneralDraft,
} from './deal-general-form-state';

const baseDraft: DealGeneralDraft = {
  name: null,
  amount: null,
  subscriptionTermMonths: null,
  paymentType: null,
  taxStatus: 'TAX',
  projectId: 'proj-1',
  linkedProjectLabel: 'Alpha',
  type: 'PRODUCT',
  maintenanceStartAt: null,
  productCategory: 'CODE',
  productType: 'COMPANY_WEBSITE',
  productPlatform: 'WEB',
  existingProductId: null,
  existingProductPickLabel: null,
  companyId: null,
  companyPickLabel: null,
  source: null,
  sourceDetail: null,
  sourcePartnerId: null,
  sourceContactId: null,
  marketingAccountId: null,
  marketingActivityId: null,
  marketingPickLabel: null,
  partnerPickLabel: null,
  clientPickLabel: null,
  notes: null,
  contactIds: [],
  contactLabels: {},
  sellerId: null,
  sellerDisplayLabel: null,
  sellerAvatar: null,
  sellerAssistantId: null,
  sellerAssistantDisplayLabel: null,
  sellerAssistantAvatar: null,
  pmId: null,
  pmDisplayLabel: null,
  pmAvatar: null,
  deadline: null,
  outsourceGoesToDelivery: false,
};

describe('buildDealTypeChangePatch', () => {
  it('clears product taxonomy when leaving PRODUCT/OUTSOURCE', () => {
    expect(buildDealTypeChangePatch(baseDraft, 'EXTENSION')).toEqual({
      type: 'EXTENSION',
      productCategory: null,
      productType: null,
      productPlatform: null,
    });
  });

  it('clears existing product when leaving EXTENSION/MAINTENANCE', () => {
    const draft: DealGeneralDraft = {
      ...baseDraft,
      type: 'EXTENSION',
      productCategory: null,
      productType: null,
      existingProductId: 'prod-1',
      existingProductPickLabel: 'Website',
    };
    expect(buildDealTypeChangePatch(draft, 'PRODUCT')).toEqual({
      type: 'PRODUCT',
      existingProductId: null,
      existingProductPickLabel: null,
    });
  });

  it('clears outsourceGoesToDelivery when leaving OUTSOURCE', () => {
    const draft: DealGeneralDraft = {
      ...baseDraft,
      type: 'OUTSOURCE',
      outsourceGoesToDelivery: true,
    };
    expect(buildDealTypeChangePatch(draft, 'PRODUCT')).toEqual({
      type: 'PRODUCT',
      outsourceGoesToDelivery: false,
    });
  });
});

describe('buildDealProjectChangePatch', () => {
  it('clears existing product when project changes', () => {
    expect(buildDealProjectChangePatch('proj-2', 'Beta')).toEqual({
      projectId: 'proj-2',
      linkedProjectLabel: 'Beta',
      existingProductId: null,
      existingProductPickLabel: null,
    });
  });
});

describe('buildDealExistingProductChangePatch', () => {
  it('sets product and fills project without clearing the product', () => {
    expect(buildDealExistingProductChangePatch('prod-1', 'Website', 'proj-2', 'Beta')).toEqual({
      existingProductId: 'prod-1',
      existingProductPickLabel: 'Website',
      projectId: 'proj-2',
      linkedProjectLabel: 'Beta',
    });
  });

  it('clears product and derived project together', () => {
    expect(buildDealExistingProductChangePatch(null, null, null, null)).toEqual({
      existingProductId: null,
      existingProductPickLabel: null,
      projectId: null,
      linkedProjectLabel: null,
    });
  });
});

describe('buildDealTaxonomyPatch', () => {
  it('maps a leftover MOBILE_APP kind onto platform APP', () => {
    expect(buildDealTaxonomyPatch('CODE', 'MOBILE_APP', 'WEB')).toEqual({
      productCategory: 'CODE',
      productType: 'MOBILE_APP',
      productPlatform: 'APP',
    });
  });

  it('does not stamp WEB onto a marketing deal', () => {
    expect(buildDealTaxonomyPatch('MARKETING', 'SEO', 'WEB')).toEqual({
      productCategory: 'MARKETING',
      productType: 'SEO',
      productPlatform: null,
    });
  });

  it('clears platform with the rest of the taxonomy', () => {
    expect(buildDealTaxonomyPatch(null, 'ECOMMERCE', 'APP')).toEqual({
      productCategory: null,
      productType: null,
      productPlatform: null,
    });
  });
});

describe('buildDealPlatformPatch', () => {
  it('keeps APP on a code deal and never writes MOBILE_APP or invents WEB', () => {
    expect(buildDealPlatformPatch(baseDraft, 'APP')).toEqual({
      productPlatform: 'APP',
      productType: null,
    });
    expect(buildDealPlatformPatch(baseDraft, 'MOBILE_APP')).toEqual({ productPlatform: null });
    expect(buildDealPlatformPatch({ ...baseDraft, productType: 'ECOMMERCE' }, 'APP')).toEqual({
      productPlatform: 'APP',
    });
  });

  it('writes WEB for WordPress without a picker value', () => {
    expect(buildDealTaxonomyPatch('WORDPRESS', 'ECOMMERCE', null)).toEqual({
      productCategory: 'WORDPRESS',
      productType: 'ECOMMERCE',
      productPlatform: 'WEB',
    });
  });

  it('leaves Code without a platform until one is chosen', () => {
    expect(buildDealTaxonomyPatch('CODE', null, null)).toEqual({
      productCategory: 'CODE',
      productType: null,
      productPlatform: null,
    });
  });
});
