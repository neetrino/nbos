import { describe, expect, it, vi } from 'vitest';
import {
  TAB_QUICK_CREATE_ANCHOR_CLASS,
  TAB_QUICK_CREATE_BUTTON_CLASS,
  TAB_QUICK_CREATE_ICON_SIZE_PX,
} from './tab-quick-create.constants';
import { stopTabQuickCreateClick } from './TabQuickCreateButton';

describe('TabQuickCreateButton helpers', () => {
  it('prevents tab switch and isolates the plus click from the tab trigger', () => {
    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();
    const onCreate = vi.fn();

    stopTabQuickCreateClick({ preventDefault, stopPropagation }, onCreate);

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(stopPropagation).toHaveBeenCalledOnce();
    expect(onCreate).toHaveBeenCalledOnce();
  });

  it('uses a circular overlay on the tab edge that does not grow the pill', () => {
    expect(TAB_QUICK_CREATE_BUTTON_CLASS).toContain('rounded-full');
    expect(TAB_QUICK_CREATE_BUTTON_CLASS).toContain('opacity-0');
    expect(TAB_QUICK_CREATE_BUTTON_CLASS).toContain('group-hover/tab:opacity-100');
    expect(TAB_QUICK_CREATE_BUTTON_CLASS).toContain('[@media(hover:none)]:opacity-100');
    expect(TAB_QUICK_CREATE_ANCHOR_CLASS).toContain('absolute');
    expect(TAB_QUICK_CREATE_ANCHOR_CLASS).toContain('translate-x-1/2');
    expect(TAB_QUICK_CREATE_ICON_SIZE_PX).toBe(14);
  });
});
