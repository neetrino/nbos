import { describe, expect, it } from 'vitest';
import { applySidebarPreferences, placeAiAgentsBeforeReports } from './apply-sidebar-preferences';
import type { NavModuleDefinition } from './nav-config';

const modules: NavModuleDefinition[] = [
  { key: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { key: 'crm', label: 'CRM', href: '/crm' },
  { key: 'mail', label: 'Mail', href: '/mail' },
];

describe('applySidebarPreferences', () => {
  it('splits visible modules into primary and hidden buckets', () => {
    const layout = applySidebarPreferences(modules, ['mail', 'crm', 'dashboard'], ['mail']);

    expect(layout.primary.map((item) => item.key)).toEqual(['crm', 'dashboard']);
    expect(layout.hidden.map((item) => item.key)).toEqual(['mail']);
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
