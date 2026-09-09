import { describe, expect, it } from 'vitest';
import { pickActiveMobileDockItem, resolveMobileDockSwitcher } from './mobile-module-dock-resolve';
import type { MobileDockItem } from './mobile-module-dock-types';
import {
  MOBILE_WORKSPACE_SWITCHER_CATEGORY_TITLE,
  MOBILE_WORKSPACE_SWITCHER_SECTION_TITLE,
  MOBILE_WORKSPACE_SWITCHER_VIEW_TITLE,
  MOBILE_WORKSPACE_SWITCHER_ZONE_TITLE,
} from './mobile-workspace-dock-constants';

function item(id: string, active = false): MobileDockItem {
  return { id, label: id, active };
}

describe('resolveMobileDockSwitcher', () => {
  it('keeps header zones and page sections as separate groups', () => {
    const resolved = resolveMobileDockSwitcher(
      [item('invoices', true)],
      [item('revenue'), item('expenses')],
      [],
      [],
    );
    expect(resolved.groups.map((group) => group.title)).toEqual([
      MOBILE_WORKSPACE_SWITCHER_ZONE_TITLE,
      MOBILE_WORKSPACE_SWITCHER_SECTION_TITLE,
    ]);
    expect(resolved.displayItem?.id).toBe('invoices');
  });

  it('uses category when the page only has list scopes', () => {
    const resolved = resolveMobileDockSwitcher([], [], [item('all'), item('company', true)], []);
    expect(resolved.groups).toEqual([
      {
        id: 'category',
        title: MOBILE_WORKSPACE_SWITCHER_CATEGORY_TITLE,
        items: [item('all'), item('company', true)],
      },
    ]);
    expect(resolved.displayItem?.id).toBe('company');
  });

  it('adds page filters as a view group when sections already exist', () => {
    const resolved = resolveMobileDockSwitcher(
      [item('leads', true), item('deals')],
      [],
      [item('incoming'), item('active')],
      [],
    );
    expect(resolved.groups[1]?.title).toBe(MOBILE_WORKSPACE_SWITCHER_VIEW_TITLE);
    expect(resolved.displayItem?.id).toBe('leads');
  });

  it('uses fallback only when nothing else registered', () => {
    const resolved = resolveMobileDockSwitcher([], [], [], [item('board', true)]);
    expect(resolved.groups[0]?.items.map((entry) => entry.id)).toEqual(['board']);
    expect(resolved.displayItem?.id).toBe('board');
  });
});

describe('pickActiveMobileDockItem', () => {
  it('returns the active item when one is selected', () => {
    expect(pickActiveMobileDockItem([item('all'), item('my', true)])?.id).toBe('my');
  });

  it('falls back to the first item when none is active', () => {
    expect(pickActiveMobileDockItem([item('all'), item('my')])?.id).toBe('all');
  });

  it('returns null for an empty list', () => {
    expect(pickActiveMobileDockItem([])).toBeNull();
  });
});
