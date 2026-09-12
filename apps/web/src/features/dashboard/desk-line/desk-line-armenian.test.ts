import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DESK_LINE_CATALOG } from './desk-line-catalog';
import { fillDeskLineSlots } from './desk-line-slots';
import { DESK_LINE_NEUTRAL_FALLBACK } from './desk-line.constants';
import { deskCopy } from '../dashboard-desk-header';
import { DashboardDeskHeader } from '../components/DashboardDeskHeader';

const state = vi.hoisted(() => ({
  now: new Date('2026-09-16T08:00:00Z') as Date | null,
  isLoading: false,
  me: { id: 'emp-anna', firstName: 'Աննա', birthday: null, hireDate: null, status: 'ACTIVE' } as {
    id: string;
    firstName: string;
    birthday: string | null;
    hireDate: string | null;
    status: string;
  } | null,
}));

vi.mock('@/lib/permissions', () => ({ usePermission: () => state }));
vi.mock('./desk-line-clock', () => ({ useYerevanDeskClock: () => state.now }));

function render(locale: 'en' | 'ru'): string {
  const resolution = deskCopy(
    state.me ? { employeeId: state.me.id, ...state.me } : null,
    state.now ?? undefined,
  );
  const messages = {
    common: {},
    dashboardDeskLine: {
      templates: {
        [resolution.templateId]: { title: 'WRONG LANGUAGE', subline: 'НЕ ПОКАЗЫВАТЬ' },
      },
    },
  };
  return renderToStaticMarkup(
    createElement(NextIntlClientProvider, {
      locale,
      timeZone: 'Asia/Yerevan',
      // A stale locale overlay must never replace the Armenian card.
      messages: messages as never,
      children: createElement(DashboardDeskHeader),
    }),
  );
}

beforeEach(() => {
  state.now = new Date('2026-09-16T08:00:00Z');
  state.isLoading = false;
  state.me = {
    id: 'emp-anna',
    firstName: 'Աննա',
    birthday: null,
    hireDate: null,
    status: 'ACTIVE',
  };
});

describe('Armenian desk content in every interface language', () => {
  it.each(['en', 'ru'] as const)('renders identical Armenian content under %s', (locale) => {
    const html = render(locale);
    expect(html).toBe(render('en'));
    expect(html).toContain('lang="hy"');
    expect(html).toContain('Աննա');
    expect(html).not.toMatch(/WRONG LANGUAGE|НЕ ПОКАЗЫВАТЬ|\{\{/u);
  });

  it.each(['en', 'ru'] as const)(
    'keeps hydration/loading and missing profile Armenian under %s',
    (locale) => {
      state.now = null;
      state.isLoading = true;
      const initial = render(locale);
      expect(initial).toContain(DESK_LINE_NEUTRAL_FALLBACK.title);
      expect(initial).toContain(DESK_LINE_NEUTRAL_FALLBACK.subline);
      state.now = new Date('2026-09-16T08:00:00Z');
      state.isLoading = false;
      state.me = null;
      expect(render(locale)).toBe(initial);
    },
  );

  it('keeps birthday and memorial copy Armenian across locale changes', () => {
    state.me!.birthday = '1994-09-16';
    expect(render('ru')).toBe(render('en'));
    expect(render('en')).toMatch(/ծնունդ|Ծնունդ|ծննդ/u);
    state.now = new Date('2026-04-24T08:00:00Z');
    state.me!.birthday = '1994-04-24';
    expect(render('en')).toBe(render('ru'));
    expect(render('ru')).toContain('խաղաղ');
  });

  it('works in an Armenian host without any interface translation provider', () => {
    // HY is reserved in the platform locale type; this block must not depend on enabling it.
    const html = renderToStaticMarkup(
      createElement('div', { lang: 'hy' }, createElement(DashboardDeskHeader)),
    );
    expect(html).toContain(render('en'));
    expect(html).toContain('Աննա');
  });
});

describe('Armenian name and number slots', () => {
  it('renders the whole catalog without a name or dangling punctuation', () => {
    for (const line of DESK_LINE_CATALOG) {
      for (const template of [line.title, line.subline]) {
        const result = fillDeskLineSlots(template, { firstName: null, years: 3 });
        expect(result, line.id).not.toMatch(/\{\{|^\s*[,։]|,\s*։|\s{2}/u);
        expect(result).toMatch(/\p{Script=Armenian}/u);
      }
    }
  });

  it('preserves profile spelling and literal replacement characters', () => {
    for (const firstName of ['Սիփան', 'Sipan', 'Сипан', '$&', 'Աննա-Մարիա']) {
      expect(
        fillDeskLineSlots('{{firstName}}, արդեն {{years}} տարի միասին։', { firstName, years: 3 }),
      ).toBe(`${firstName}, արդեն 3 տարի միասին։`);
    }
    expect(fillDeskLineSlots('Ծնունդդ շնորհավոր, {{firstName}}։', { firstName: null })).toBe(
      'Ծնունդդ շնորհավոր։',
    );
  });
});
