import { describe, expect, it } from 'vitest';
import type { MobileDockSwitcherGroup } from './mobile-module-dock-types';
import {
  resolveMobileDockGroupTitle,
  resolveMobileDockSwitcherTitle,
} from './mobile-dock-switcher-title';

const GROUP: MobileDockSwitcherGroup = {
  id: 'zone',
  title: 'Zone',
  items: [{ id: 'sales', label: 'Sales', active: false }],
};

describe('resolveMobileDockSwitcherTitle', () => {
  it('uses Go to when more than one group is present', () => {
    const title = resolveMobileDockSwitcherTitle(
      [GROUP, { ...GROUP, id: 'section', title: 'Section' }],
      (key) => (key === 'mobileDock.goTo' ? 'Перейти' : key),
    );

    expect(title).toBe('Перейти');
  });

  it('translates a single known group by id', () => {
    expect(resolveMobileDockGroupTitle(GROUP, () => 'Зона')).toBe('Зона');
    expect(resolveMobileDockSwitcherTitle([GROUP], () => 'Зона')).toBe('Зона');
  });
});
