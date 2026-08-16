import { describe, expect, it } from 'vitest';
import {
  buildDealProjectChangePatch,
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
