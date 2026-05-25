import { describe, expect, it } from 'vitest';
import {
  resolveSidebarModuleOrder,
  sanitizeHiddenSidebarModules,
  sanitizeSidebarModuleOrder,
} from './sidebar-navigation';

describe('sidebar-navigation', () => {
  it('sanitizes module order and drops unknown keys', () => {
    expect(sanitizeSidebarModuleOrder(['crm', 'unknown', 'crm', 'finance'])).toEqual([
      'crm',
      'finance',
    ]);
  });

  it('prevents hiding dashboard', () => {
    expect(sanitizeHiddenSidebarModules(['dashboard', 'mail'])).toEqual(['mail']);
  });

  it('merges saved order with visible keys using default tail', () => {
    expect(resolveSidebarModuleOrder(['finance', 'crm'], ['crm', 'finance', 'tasks'])).toEqual([
      'finance',
      'crm',
      'tasks',
    ]);
  });
});
