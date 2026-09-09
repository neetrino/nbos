import { describe, expect, it } from 'vitest';
import { mergeMobileDockItems, resolveMobileDockSlots } from './mobile-module-dock-resolve';
import type { MobileDockItem } from './mobile-module-dock-types';

function item(id: string, active = false): MobileDockItem {
  return { id, label: id, active };
}

describe('mergeMobileDockItems', () => {
  it('keeps module section links first, then header zones, then page filters', () => {
    const merged = mergeMobileDockItems(
      [item('leads'), item('deals')],
      [item('all'), item('my')],
      [item('project')],
    );
    expect(merged.map((entry) => entry.id)).toEqual(['leads', 'deals', 'project', 'all', 'my']);
  });

  it('uses header zones when the page has no section links', () => {
    const merged = mergeMobileDockItems([], [item('incoming')], [item('project'), item('product')]);
    expect(merged.map((entry) => entry.id)).toEqual(['project', 'product', 'incoming']);
  });
});

describe('resolveMobileDockSlots', () => {
  it('keeps four or fewer items on the bar', () => {
    const items = [item('a'), item('b'), item('c'), item('d')];
    expect(resolveMobileDockSlots(items)).toEqual({ slots: items, overflow: [] });
  });

  it('keeps three items and overflows the rest when there are more than four', () => {
    const items = [item('a'), item('b'), item('c'), item('d'), item('e')];
    expect(resolveMobileDockSlots(items)).toEqual({
      slots: [item('a'), item('b'), item('c')],
      overflow: [item('d'), item('e')],
    });
  });
});
