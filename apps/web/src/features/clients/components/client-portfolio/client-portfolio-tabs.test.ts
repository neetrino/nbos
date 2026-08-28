import { describe, expect, it } from 'vitest';
import type { PortfolioAccessMask } from '@/lib/api/client-portfolio';
import { DETAIL_TABS_LOADING_MASK, detailTabsForMask } from './client-portfolio-tabs';

const crmOnlyMask: PortfolioAccessMask = {
  finance: false,
  subscriptions: false,
  support: false,
  communication: true,
  files: false,
  financeAmounts: false,
};

describe('detailTabsForMask', () => {
  it('puts Calls on the contact sheet and drops Communication', () => {
    const ids = detailTabsForMask(DETAIL_TABS_LOADING_MASK, 'contact').map((tab) => tab.id);
    expect(ids).toContain('calls');
    expect(ids).not.toContain('communication');
    expect(ids.indexOf('calls')).toBeLessThan(ids.indexOf('files'));
  });

  it('keeps Communication on the company sheet and does not add Calls', () => {
    const ids = detailTabsForMask(DETAIL_TABS_LOADING_MASK, 'company').map((tab) => tab.id);
    expect(ids).toContain('communication');
    expect(ids).not.toContain('calls');
  });

  it('still shows Calls on a contact when Communication is the only extra mask flag', () => {
    const ids = detailTabsForMask(crmOnlyMask, 'contact').map((tab) => tab.id);
    expect(ids).toEqual(['general', 'projects', 'calls']);
  });
});
