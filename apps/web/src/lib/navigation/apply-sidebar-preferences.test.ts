import { describe, expect, it } from 'vitest';
import { applySidebarPreferences } from './apply-sidebar-preferences';
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
