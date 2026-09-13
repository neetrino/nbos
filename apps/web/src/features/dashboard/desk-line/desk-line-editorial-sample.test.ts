import { describe, expect, it } from 'vitest';
import { resolveDeskLineDetails } from './desk-line-resolve';

const PEOPLE = ['emp-sipan', 'emp-anna', 'emp-levon', 'emp-nune', 'emp-karen'] as const;
const START = new Date('2026-09-14T08:00:00.000Z');

describe('desk-line editorial sample', () => {
  it('assigns 5 people × 14 days without collapsing to one joke', () => {
    const titles: string[] = [];
    for (const employeeId of PEOPLE) {
      const ids: string[] = [];
      for (let day = 0; day < 14; day += 1) {
        const now = new Date(START.getTime() + day * 86_400_000);
        const resolved = resolveDeskLineDetails(
          { employeeId, firstName: employeeId.replace('emp-', '') },
          now,
        );
        ids.push(resolved.templateId);
        titles.push(resolved.title);
      }
      expect(new Set(ids).size).toBeGreaterThan(8);
    }
    const coffeeHits = titles.filter((title) => /սուրճ/u.test(title)).length;
    expect(coffeeHits).toBeLessThan(8);
  });
});
