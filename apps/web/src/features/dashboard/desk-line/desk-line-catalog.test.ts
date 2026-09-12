import { describe, expect, it } from 'vitest';
import { DESK_LINE_CATALOG, deskLinePool } from './desk-line-catalog';
import {
  DESK_LINE_EVERYDAY_MIN_SIZE,
  DESK_LINE_SEASON_MIN_SIZE,
} from './desk-line.constants';
import { DESK_LINE_ICON_KEYS, type DeskLinePoolId } from './desk-line.types';

const BANNED = [
  /no rush/iu,
  /you did enough/iu,
  /leave looks good/iu,
  /the desk remembers/iu,
  /we are proud of you/iu,
  /you deserve a break/iu,
  /you worked hard/iu,
  /crush your goals/iu,
  /be your best self/iu,
  /\bthere,/iu,
];

function normalizePair(title: string, subline: string): string {
  return `${title}\n${subline}`
    .toLowerCase()
    .replaceAll('{{firstname}}', '')
    .replaceAll('{{years}}', '')
    .replace(/[^a-z0-9\s]/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
}

describe('desk-line catalog', () => {
  it('meets pool minimums and unique ids', () => {
    const ids = DESK_LINE_CATALOG.map((line) => line.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(deskLinePool('everyday').length).toBeGreaterThanOrEqual(DESK_LINE_EVERYDAY_MIN_SIZE);
    const seasons: DeskLinePoolId[] = [
      'season_spring',
      'season_summer',
      'season_autumn',
      'season_winter',
    ];
    for (const pool of seasons) {
      expect(deskLinePool(pool).length).toBeGreaterThanOrEqual(DESK_LINE_SEASON_MIN_SIZE);
    }
    expect(DESK_LINE_CATALOG.length).toBeGreaterThanOrEqual(190);
    expect(DESK_LINE_CATALOG.length).toBeLessThanOrEqual(220);
  });

  it('keeps icons, slots, and copy legal', () => {
    const seen = new Set<string>();
    for (const line of DESK_LINE_CATALOG) {
      expect(DESK_LINE_ICON_KEYS.includes(line.icon)).toBe(true);
      expect(line.title.includes('{{')).toBe(
        line.title.includes('{{firstName}}') || line.title.includes('{{years}}'),
      );
      expect(line.title).not.toMatch(/TODO|FIXME|xxx/iu);
      expect(line.subline).not.toMatch(/TODO|FIXME|xxx/iu);
      for (const banned of BANNED) {
        expect(`${line.title} ${line.subline}`).not.toMatch(banned);
      }
      expect(`${line.title} ${line.subline}`).not.toMatch(/promise about work|season’s mood|season's mood/iu);
      const key = normalizePair(line.title, line.subline);
      expect(seen.has(key), line.id).toBe(false);
      seen.add(key);
    }
  });

  it('gives cultural events at least three variants', () => {
    const byEvent = new Map<string, number>();
    for (const line of deskLinePool('cultural')) {
      if (!line.eventId) continue;
      byEvent.set(line.eventId, (byEvent.get(line.eventId) ?? 0) + 1);
    }
    for (const [eventId, count] of byEvent) {
      expect(count, eventId).toBeGreaterThanOrEqual(3);
    }
  });
});
