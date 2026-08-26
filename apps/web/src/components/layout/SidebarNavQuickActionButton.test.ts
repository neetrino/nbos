import { describe, expect, it, vi } from 'vitest';
import {
  SIDEBAR_CREATE_TASK_ARIA_LABEL,
  SIDEBAR_NAV_QUICK_ACTION_BUTTON_CLASS,
  SIDEBAR_NAV_QUICK_ACTION_ICON_SIZE_PX,
  stopSidebarNavQuickActionClick,
} from './SidebarNavQuickActionButton';

describe('SidebarNavQuickActionButton helpers', () => {
  it('prevents navigation and isolates the plus click from the nav link', () => {
    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();
    const onAction = vi.fn();

    stopSidebarNavQuickActionClick({ preventDefault, stopPropagation }, onAction);

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(stopPropagation).toHaveBeenCalledOnce();
    expect(onAction).toHaveBeenCalledOnce();
  });

  it('keeps the plus hover-only until the row is hovered or focused', () => {
    expect(SIDEBAR_NAV_QUICK_ACTION_BUTTON_CLASS).toContain('opacity-0');
    expect(SIDEBAR_NAV_QUICK_ACTION_BUTTON_CLASS).toContain('group-hover:opacity-100');
    expect(SIDEBAR_NAV_QUICK_ACTION_BUTTON_CLASS).toContain('focus-visible:opacity-100');
    expect(SIDEBAR_CREATE_TASK_ARIA_LABEL).toBe('Create task');
  });

  it('uses a larger glyph, 32px hit target, and inset from the row edge', () => {
    expect(SIDEBAR_NAV_QUICK_ACTION_ICON_SIZE_PX).toBe(22);
    expect(SIDEBAR_NAV_QUICK_ACTION_BUTTON_CLASS).toContain('size-8');
    expect(SIDEBAR_NAV_QUICK_ACTION_BUTTON_CLASS).toContain('mr-1');
  });
});
