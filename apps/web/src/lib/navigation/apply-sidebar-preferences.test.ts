import { describe, expect, it } from 'vitest';
import {
  applySidebarPreferences,
  getSidebarFooterModule,
  placeAiAgentsBeforeReports,
} from './apply-sidebar-preferences';
import type { NavModuleDefinition } from './nav-config';

const modules: NavModuleDefinition[] = [
  { key: 'dashboard', label: 'modules.dashboard', href: '/dashboard' },
  { key: 'crm', label: 'modules.crm', href: '/crm' },
  { key: 'mail', label: 'modules.mail', href: '/mail' },
];

describe('applySidebarPreferences', () => {
  it('splits visible modules into primary and hidden buckets', () => {
    const layout = applySidebarPreferences(modules, ['mail', 'crm', 'dashboard'], ['mail']);

    expect(layout.primary.map((item) => item.key)).toEqual(['crm', 'dashboard']);
    expect(layout.hidden.map((item) => item.key)).toEqual(['mail']);
  });

  it('keeps footer modules out of the reorderable list and strips children', () => {
    const withFooter: NavModuleDefinition[] = [
      ...modules,
      {
        key: 'settings',
        label: 'modules.settings',
        href: '/settings',
        sidebarSlot: 'footer',
        children: [{ label: 'children.settings.general', href: '/settings' }],
      },
      {
        key: 'messenger',
        label: 'modules.messenger',
        href: '/messenger',
        children: [{ label: 'children.messenger.all', href: '/messenger' }],
      },
    ];

    const layout = applySidebarPreferences(withFooter, [], []);

    expect(layout.primary.map((item) => item.key)).toEqual([
      'dashboard',
      'crm',
      'messenger',
      'mail',
    ]);
    expect(layout.primary.every((item) => item.children === undefined)).toBe(true);
    expect(layout.hidden).toEqual([]);
  });

  it('returns the pinned footer module for the Settings row', () => {
    const settings: NavModuleDefinition = {
      key: 'settings',
      label: 'modules.settings',
      href: '/settings',
      sidebarSlot: 'footer',
    };

    expect(getSidebarFooterModule([...modules, settings])?.key).toBe('settings');
    expect(getSidebarFooterModule(modules)).toBeNull();
  });
});

describe('placeAiAgentsBeforeReports', () => {
  it('moves AI above Analytics even when other modules sit between them', () => {
    expect(placeAiAgentsBeforeReports(['credentials', 'reports', 'settings', 'ai-agents'])).toEqual(
      ['credentials', 'ai-agents', 'reports', 'settings'],
    );
  });

  it('leaves AI already above Analytics unchanged', () => {
    expect(placeAiAgentsBeforeReports(['ai-agents', 'reports', 'settings'])).toEqual([
      'ai-agents',
      'reports',
      'settings',
    ]);
  });
});
