import { describe, expect, it } from 'vitest';
import { isNavChildLink, NAV_MODULE_DEFINITIONS } from '@/lib/navigation/nav-config';
import { MY_COMPANY_NAV, myCompanyHubSections } from './my-company-module-nav';

describe('my company navigation', () => {
  it('hub cards follow the hero tabs, without the current org screen', () => {
    const tabs = MY_COMPANY_NAV.filter((item) => item.href !== '/my-company');
    const cards = myCompanyHubSections();

    expect(cards.map((item) => item.href)).toEqual(tabs.map((item) => item.href));
    expect(cards.map((item) => item.labelKey)).toEqual(tabs.map((item) => item.labelKey));
  });

  it('sidebar children follow the same company tabs', () => {
    const company = NAV_MODULE_DEFINITIONS.find((item) => item.key === 'my-company');
    const hrefs = company?.children?.flatMap((child) =>
      isNavChildLink(child) ? [child.href] : [],
    );

    expect(hrefs).toEqual(MY_COMPANY_NAV.map((item) => item.href));
  });
});
