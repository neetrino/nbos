import { describe, expect, it } from 'vitest';
import { nextYerevanMidnightUtc, parseValidCalendarDate, yerevanCalendarDay } from './desk-line-calendar';
import { DESK_LINE_REPEAT_WINDOW_DAYS } from './desk-line.constants';
import { deskLinePool } from './desk-line-catalog';
import { isSeasonSlot, seasonPhase } from './desk-line-deck';
import { resolveDeskLineDetails } from './desk-line-resolve';
import { DESK_LINE_SEASON_SLOT_PERIOD } from './desk-line.constants';

const SIPAN = { employeeId: 'emp-sipan', firstName: 'Sipan' };

function atYerevan(isoUtc: string): Date {
  return new Date(isoUtc);
}

function addUtcDays(start: Date, days: number): Date {
  return new Date(start.getTime() + days * 86_400_000);
}

describe('desk-line calendar', () => {
  it('reads the same Yerevan day across local hours', () => {
    const morning = yerevanCalendarDay(atYerevan('2026-09-16T20:01:00.000Z'));
    const late = yerevanCalendarDay(atYerevan('2026-09-17T19:59:00.000Z'));
    expect(morning.dateKey).toBe('2026-09-17');
    expect(late.dateKey).toBe('2026-09-17');
    expect(morning.dayOrdinal).toBe(late.dayOrdinal);
  });

  it('rejects impossible calendar dates', () => {
    expect(parseValidCalendarDate('2026-02-30')).toBeNull();
    expect(parseValidCalendarDate('2026-13-01')).toBeNull();
    expect(parseValidCalendarDate('1994-03-12T00:00:00.000Z')).toEqual({
      year: 1994,
      month: 3,
      day: 12,
    });
  });

  it('places Yerevan midnight at 20:00 UTC', () => {
    const now = atYerevan('2026-09-16T06:00:00.000Z');
    expect(nextYerevanMidnightUtc(now).toISOString()).toBe('2026-09-16T20:00:00.000Z');
  });
});

describe('stability', () => {
  it('keeps one pair from 00:01 to 23:59 Yerevan', () => {
    const instants = [
      '2026-09-15T20:01:00.000Z',
      '2026-09-16T07:00:00.000Z',
      '2026-09-16T14:00:00.000Z',
      '2026-09-16T19:59:00.000Z',
    ];
    const ids = instants.map((iso) => resolveDeskLineDetails(SIPAN, atYerevan(iso)).templateId);
    expect(new Set(ids).size).toBe(1);
    expect(ids[0]).not.toMatch(/morning|afternoon|evening/iu);
  });

  it('changes after the Yerevan day boundary', () => {
    const before = resolveDeskLineDetails(SIPAN, atYerevan('2026-09-16T19:59:00.000Z'));
    const after = resolveDeskLineDetails(SIPAN, atYerevan('2026-09-16T20:00:00.000Z'));
    expect(before.templateId).not.toBe(after.templateId);
  });

  it('renames the person without changing the template', () => {
    const now = atYerevan('2026-09-16T08:00:00.000Z');
    const sipan = resolveDeskLineDetails(SIPAN, now);
    const anna = resolveDeskLineDetails({ ...SIPAN, firstName: 'Anna' }, now);
    expect(anna.templateId).toBe(sipan.templateId);
    expect(`${anna.title} ${anna.subline}`).toContain('Anna');
    expect(`${anna.title} ${anna.subline}`).not.toContain('Sipan');
  });

  it('is independent of call order', () => {
    const now = atYerevan('2026-09-16T08:00:00.000Z');
    const later = resolveDeskLineDetails({ employeeId: 'emp-later', firstName: 'Levon' }, now);
    const first = resolveDeskLineDetails(SIPAN, now);
    expect(resolveDeskLineDetails(SIPAN, now).templateId).toBe(first.templateId);
    expect(resolveDeskLineDetails({ employeeId: 'emp-later', firstName: 'Levon' }, now).templateId).toBe(
      later.templateId,
    );
  });
});

describe('personal events', () => {
  it('prefers birthday over a cultural date', () => {
    const now = atYerevan('2026-04-22T20:30:00.000Z');
    const resolved = resolveDeskLineDetails(
      { ...SIPAN, birthday: '1994-04-23' },
      now,
    );
    expect(resolved.pool).toBe('birthday');
    expect(resolved.icon).toBe('Cake');
    expect(resolved.title).not.toMatch(/World Book/iu);
  });

  it('uses first day and anniversary grammar', () => {
    const first = resolveDeskLineDetails(
      { ...SIPAN, hireDate: '2026-09-16' },
      atYerevan('2026-09-16T08:00:00.000Z'),
    );
    expect(first.pool).toBe('first_day');
    const one = resolveDeskLineDetails(
      { ...SIPAN, hireDate: '2025-09-16' },
      atYerevan('2026-09-16T08:00:00.000Z'),
    );
    expect(one.pool).toBe('anniversary_one');
    expect(one.title + one.subline).toMatch(/year/iu);
    expect(one.title + one.subline).not.toMatch(/1 years/u);
    const many = resolveDeskLineDetails(
      { ...SIPAN, hireDate: '2023-09-16' },
      atYerevan('2026-09-16T08:00:00.000Z'),
    );
    expect(many.pool).toBe('anniversary_many');
    expect(many.title).toContain('3');
  });

  it('observes 29 February birthdays on 28 February in a common year', () => {
    const resolved = resolveDeskLineDetails(
      { ...SIPAN, birthday: '2000-02-29' },
      atYerevan('2025-02-27T20:30:00.000Z'),
    );
    expect(resolved.pool).toBe('birthday');
  });

  it('uses onboarding only on days 3, 10 and 21', () => {
    const hire = '2026-09-01';
    const day = (offset: number) =>
      resolveDeskLineDetails(
        { ...SIPAN, hireDate: hire },
        addUtcDays(atYerevan('2026-08-31T20:30:00.000Z'), offset),
      );
    expect(day(3).pool).toBe('onboarding_3');
    expect(day(10).pool).toBe('onboarding_10');
    expect(day(21).pool).toBe('onboarding_21');
    expect(day(4).pool).not.toMatch(/onboarding/u);
    expect(day(-1).pool).not.toMatch(/onboarding|first_day/u);
  });

  it('does not invent leave copy from ON_LEAVE', () => {
    const resolved = resolveDeskLineDetails(
      { ...SIPAN, status: 'ON_LEAVE' },
      atYerevan('2026-09-16T08:00:00.000Z'),
    );
    expect(resolved.title + resolved.subline).not.toMatch(/leave|holiday|rest well/iu);
    expect(resolved.pool).not.toBe('first_day');
  });
});

describe('memorial 24 April', () => {
  const memorialInstant = atYerevan('2026-04-23T20:30:00.000Z');

  it('uses a quiet pair without celebration icons', () => {
    const resolved = resolveDeskLineDetails(SIPAN, memorialInstant);
    expect(resolved.pool).toBe('memorial_neutral');
    expect(resolved.icon).toBe('None');
    expect(resolved.title + resolved.subline).toMatch(/peaceful|quiet|decent/iu);
    expect(resolved.title + resolved.subline).not.toMatch(/Friday|Party|celebrate|Book Day/iu);
  });

  it('keeps a birthday restrained', () => {
    const resolved = resolveDeskLineDetails(
      { ...SIPAN, birthday: '1990-04-24' },
      memorialInstant,
    );
    expect(resolved.pool).toBe('birthday_memorial');
    expect(resolved.icon).not.toBe('PartyPopper');
    expect(resolved.title + resolved.subline).not.toMatch(/confetti|celebrate/iu);
  });

  it('routes onboarding on 24 April to the memorial neutral pair', () => {
    const resolved = resolveDeskLineDetails(
      { employeeId: 'emp-anna', firstName: 'Anna', hireDate: '2026-04-03' },
      memorialInstant,
    );
    expect(resolved.pool).toBe('memorial_neutral');
    expect(resolved.icon).toBe('None');
    expect(resolved.title + resolved.subline).not.toMatch(/good surprises|Smile|Friday/iu);
    expect(resolved.templateId).not.toMatch(/onboarding/u);
  });

  it('does not thank a first-year anniversary for several years', () => {
    const resolved = resolveDeskLineDetails(
      { ...SIPAN, hireDate: '2025-04-24' },
      memorialInstant,
    );
    expect(resolved.pool).toBe('anniversary_memorial');
    expect(resolved.title + resolved.subline).not.toMatch(/years here|1 years/iu);
    expect(resolved.title + resolved.subline).toMatch(/thank you for being here/iu);
  });
});

describe('diversity and decks', () => {
  it('varies template ids across thirty people', () => {
    const now = atYerevan('2026-09-16T08:00:00.000Z');
    const ids = Array.from({ length: 30 }, (_, index) =>
      resolveDeskLineDetails(
        { employeeId: `emp-${index}`, firstName: 'Alex' },
        now,
      ),
    );
    const uniqueIds = new Set(ids.map((item) => item.templateId));
    const uniqueThemes = new Set(ids.map((item) => item.theme));
    expect(uniqueIds.size).toBeGreaterThan(8);
    expect(uniqueThemes.size).toBeGreaterThan(3);
  });

  it('avoids everyday and seasonal repeats inside 45 days', () => {
    const start = atYerevan('2026-01-01T08:00:00.000Z');
    for (const employeeId of ['emp-a', 'emp-b', 'emp-c']) {
      const recent: string[] = [];
      for (let day = 0; day < 400; day += 1) {
        const resolved = resolveDeskLineDetails(
          { employeeId, firstName: 'Alex' },
          addUtcDays(start, day),
        );
        if (resolved.pool === 'everyday' || resolved.pool.startsWith('season_')) {
          expect(recent.includes(resolved.templateId), `${employeeId} day ${day}`).toBe(false);
          recent.push(resolved.templateId);
          if (recent.length > DESK_LINE_REPEAT_WINDOW_DAYS) recent.shift();
        }
      }
    }
  });

  it('uses the full seasonal deck across slots', () => {
    const employeeId = 'emp-season';
    const start = atYerevan('2026-09-01T08:00:00.000Z');
    const seen = new Set<string>();
    for (let day = 0; day < 80; day += 1) {
      const now = addUtcDays(start, day);
      const today = yerevanCalendarDay(now);
      const phase = seasonPhase(employeeId);
      if (!isSeasonSlot(today.dayOrdinal, phase, DESK_LINE_SEASON_SLOT_PERIOD)) continue;
      if (today.month < 9 || today.month > 11) continue;
      const resolved = resolveDeskLineDetails({ employeeId, firstName: 'Alex' }, now);
      if (resolved.pool === 'season_autumn') seen.add(resolved.templateId);
    }
    expect(seen.size).toBe(deskLinePool('season_autumn').length);
  });

  it('shows a cultural event to only part of a sample', () => {
    const now = atYerevan('2026-04-22T20:30:00.000Z');
    const people = Array.from({ length: 24 }, (_, index) =>
      resolveDeskLineDetails({ employeeId: `book-${index}`, firstName: 'Alex' }, now),
    );
    const books = people.filter((item) => item.pool === 'cultural');
    const others = people.filter((item) => item.pool !== 'cultural');
    expect(books.length).toBeGreaterThan(1);
    expect(others.length).toBeGreaterThan(1);
    expect(new Set(books.map((item) => item.templateId)).size).toBeGreaterThan(1);
  });
});

describe('fallbacks', () => {
  it('does not emit a technical placeholder without a name', () => {
    const resolved = resolveDeskLineDetails(
      { employeeId: 'emp-noname' },
      atYerevan('2026-09-16T08:00:00.000Z'),
    );
    expect(resolved.title).not.toMatch(/there|undefined|null|\{\{/iu);
    expect(resolved.subline).not.toMatch(/there|\{\{/iu);
  });

  it('handles a long unicode name', () => {
    const resolved = resolveDeskLineDetails(
      { employeeId: 'emp-long', firstName: 'Սիփան-Անահիտ Արեգնազան' },
      atYerevan('2026-09-16T08:00:00.000Z'),
    );
    expect(resolved.title.length).toBeGreaterThan(0);
    expect(resolved.title).not.toMatch(/\{\{/u);
  });
});
