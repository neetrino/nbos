import { describe, expect, it } from 'vitest';
import { pickMobileDockKeys } from './mobile-bottom-nav-constants';

describe('pickMobileDockKeys', () => {
  it('keeps the preferred primary modules first', () => {
    expect(pickMobileDockKeys(['dashboard', 'crm', 'tasks', 'messenger', 'finance'])).toEqual([
      'dashboard',
      'crm',
      'tasks',
      'messenger',
    ]);
  });

  it('fills gaps with fallback modules', () => {
    expect(pickMobileDockKeys(['dashboard', 'finance', 'calendar'])).toEqual([
      'dashboard',
      'finance',
      'calendar',
    ]);
  });
});
