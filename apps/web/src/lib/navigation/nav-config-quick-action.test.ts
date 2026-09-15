import { describe, expect, it } from 'vitest';
import { NAV_MODULE_DEFINITIONS } from './nav-config';

describe('nav quick actions', () => {
  it('assigns unsorted-task create only to the Tasks item', () => {
    const withAction = NAV_MODULE_DEFINITIONS.filter((item) => item.quickAction);

    expect(withAction).toHaveLength(1);
    expect(withAction[0]?.key).toBe('tasks');
    expect(withAction[0]?.quickAction).toBe('create-unsorted-task');
  });

  it('pins Settings to the sidebar footer', () => {
    const settings = NAV_MODULE_DEFINITIONS.find((item) => item.key === 'settings');

    expect(settings?.sidebarSlot).toBe('footer');
    expect(NAV_MODULE_DEFINITIONS.filter((item) => item.sidebarSlot === 'footer')).toHaveLength(1);
  });

  it('exposes Calls as a top-level journal gated by CALLS VIEW', () => {
    expect(NAV_MODULE_DEFINITIONS.find((item) => item.key === 'calls')).toEqual(
      expect.objectContaining({
        href: '/calls',
        permission: { module: 'CALLS', action: 'VIEW' },
      }),
    );
  });
});
