import { describe, expect, it } from 'vitest';
import {
  DASHBOARD_DESK_FALLBACK_GREETING,
  DASHBOARD_DESK_FALLBACK_SUBLINE,
  DASHBOARD_PRIORITY_CARD_CODES,
  deskCopy,
  getPriorityCardCode,
  localizeDeskLineCopy,
  readDeskLineCatalogTemplates,
  resolvePriorityCardCount,
} from './dashboard-desk-header';
import type { PriorityCard } from './dashboard-control-registry';

describe('deskCopy', () => {
  it('uses the stable neutral pair without a profile', () => {
    const copy = deskCopy(null);
    expect(copy.title).toBe(DASHBOARD_DESK_FALLBACK_GREETING);
    expect(copy.subline).toBe(DASHBOARD_DESK_FALLBACK_SUBLINE);
    expect(copy.templateId).toBe('fallback-peaceful');
  });

  it('returns a wish rather than a time of day', () => {
    const copy = deskCopy(
      { employeeId: 'emp-anna', firstName: 'Anna' },
      new Date('2026-09-16T08:00:00.000Z'),
    );
    expect(copy.title).not.toMatch(/Welcome back|Good afternoon|Afternoon,/iu);
    expect(copy.templateId.length).toBeGreaterThan(3);
    expect(copy.icon).toBeTruthy();
  });
});

function priorityCard(overrides: Partial<PriorityCard>): PriorityCard {
  return {
    title: '3 tasks due today',
    context: 'Tasks has work waiting for action.',
    href: '/tasks',
    severity: 'high',
    source: 'Tasks',
    ...overrides,
  };
}

describe('desk-line catalog messages', () => {
  it('keeps {{firstName}} slots instead of treating them as ICU', () => {
    const catalog = readDeskLineCatalogTemplates(
      {
        templates: {
          'season-autumn-conversation': {
            title: 'Осенний разговор наверстать было бы здорово, {{firstName}}.',
            subline: 'Даже короткий.',
          },
        },
      },
      'season-autumn-conversation',
    );
    const localized = localizeDeskLineCopy(
      {
        ...deskCopy(null),
        templateId: 'season-autumn-conversation',
        titleTemplate: catalog.title ?? '',
        sublineTemplate: catalog.subline ?? '',
        slots: { firstName: 'Анна' },
      },
      { title: catalog.title ?? '', subline: catalog.subline ?? '' },
    );

    expect(localized.title).toBe('Осенний разговор наверстать было бы здорово, Анна.');
    expect(localized.title).not.toContain('{{');
  });
});

describe('priority card localization', () => {
  it('maps API codes and prefers API count', () => {
    expect(
      getPriorityCardCode(priorityCard({ code: 'critical_tickets', source: 'Other' })),
    ).toBe(DASHBOARD_PRIORITY_CARD_CODES.criticalSupportTicket);
    expect(resolvePriorityCardCount(priorityCard({ count: 7, title: '1 leftover' }))).toBe(7);
  });

  it('falls back to source/severity and the English title prefix', () => {
    expect(getPriorityCardCode(priorityCard({ source: 'Finance', severity: 'high' }))).toBe(
      DASHBOARD_PRIORITY_CARD_CODES.pendingInvoice,
    );
    expect(resolvePriorityCardCount(priorityCard({ title: '4 pending invoices' }))).toBe(4);
  });
});
