import { describe, expect, it } from 'vitest';
import { LEAD_SVYAZAT_LABELS } from './lead-svyazat-labels';
import { LEAD_SVYAZAT_MENU_GROUPS, svyazatMenuItemDisabled } from './lead-svyazat-menu-items';

describe('lead svyazat menu', () => {
  it('keeps merge and add groups without nested flyouts', () => {
    expect(LEAD_SVYAZAT_MENU_GROUPS.map((group) => group.label)).toEqual([
      LEAD_SVYAZAT_LABELS.merge,
      LEAD_SVYAZAT_LABELS.add,
    ]);
    expect(LEAD_SVYAZAT_MENU_GROUPS[0]?.items.map((item) => item.id)).toEqual(['merge', 'pour']);
    expect(LEAD_SVYAZAT_MENU_GROUPS[1]?.items.map((item) => item.id)).toEqual(['create', 'attach']);
  });

  it('disables add items only when the Lead already has a Contact', () => {
    const addItems = LEAD_SVYAZAT_MENU_GROUPS[1]?.items ?? [];
    expect(addItems.every((item) => svyazatMenuItemDisabled(item, true))).toBe(true);
    expect(addItems.every((item) => !svyazatMenuItemDisabled(item, false))).toBe(true);
    expect(
      LEAD_SVYAZAT_MENU_GROUPS[0]?.items.every((item) => !svyazatMenuItemDisabled(item, true)),
    ).toBe(true);
  });
});
