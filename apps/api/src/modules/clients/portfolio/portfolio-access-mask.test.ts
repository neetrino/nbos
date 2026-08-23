import { describe, expect, it } from 'vitest';
import { buildPortfolioAccessMask } from './portfolio-access-mask';

describe('buildPortfolioAccessMask communication', () => {
  it('includes Communication when the user can view CRM Leads or Deals', () => {
    expect(buildPortfolioAccessMask({ CRM_LEADS_VIEW: 'OWN' }).communication).toBe(true);
    expect(buildPortfolioAccessMask({ CRM_DEALS_VIEW: 'ALL' }).communication).toBe(true);
    expect(buildPortfolioAccessMask({ MESSENGER_VIEW: 'ALL' }).communication).toBe(true);
    expect(buildPortfolioAccessMask({ CRM_LEADS_VIEW: 'NONE' }).communication).toBe(false);
  });
});
