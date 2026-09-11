import { describe, expect, it } from 'vitest';
import { crmHeaderContent, isCrmHeaderContextPath } from './crm-header-context-content';

const HREFS = {
  dashboard: '/crm/dashboard',
  leads: '/crm/leads',
  deals: '/crm/deals',
} as const;

describe('crmHeaderContent', () => {
  it('covers CRM section routes only', () => {
    expect(isCrmHeaderContextPath('/crm/dashboard')).toBe(true);
    expect(isCrmHeaderContextPath('/crm/leads')).toBe(true);
    expect(isCrmHeaderContextPath('/crm/deals')).toBe(true);
    expect(isCrmHeaderContextPath('/crm')).toBe(false);
    expect(isCrmHeaderContextPath('/projects')).toBe(false);
  });

  it('builds Project-style zone tabs with the matching section active', () => {
    const content = crmHeaderContent('/crm/deals', HREFS);
    expect(content?.kind).toBe('nav');
    if (content?.kind !== 'nav') return;

    expect(content.items.map((item) => item.label)).toEqual(['Dashboard', 'Leads', 'Deals']);
    expect(content.items[2]?.isActive?.('/crm/deals')).toBe(true);
    expect(content.items[0]?.isActive?.('/crm/deals')).toBe(false);
    expect(content.items[1]?.isActive?.('/crm/deals')).toBe(false);
  });
});
