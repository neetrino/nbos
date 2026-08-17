import { describe, expect, it } from 'vitest';
import {
  parseRecurringChecklistData,
  parseRecurringLinksData,
} from './recurring-task-template-data';

describe('recurring-task-template-data', () => {
  it('parses checklist items from strings and text objects', () => {
    expect(
      parseRecurringChecklistData({
        title: 'Ops',
        items: ['WHOIS', { text: 'SSL' }, ''],
      }),
    ).toEqual({ title: 'Ops', items: ['WHOIS', 'SSL'] });
  });

  it('returns null for empty checklist', () => {
    expect(parseRecurringChecklistData({ items: [] })).toBeNull();
  });

  it('parses link rows from wrapped or raw arrays', () => {
    const row = { entityType: 'PRODUCT', entityId: 'p1' };
    expect(parseRecurringLinksData({ links: [row] })).toEqual([row]);
    expect(parseRecurringLinksData([row])).toEqual([row]);
  });
});
