import { describe, expect, it, vi } from 'vitest';
import {
  TAB_QUICK_CREATE_BUTTON_CLASS,
  TAB_QUICK_CREATE_ICON_SIZE_PX,
  TAB_QUICK_CREATE_SLOT_CLASS,
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

  it('reveals the plus on tab hover and keeps a reserved slot width', () => {
    expect(TAB_QUICK_CREATE_BUTTON_CLASS).toContain('opacity-0');
    expect(TAB_QUICK_CREATE_BUTTON_CLASS).toContain('group-hover/tab:opacity-100');
    expect(TAB_QUICK_CREATE_BUTTON_CLASS).toContain('focus-visible:opacity-100');
    expect(TAB_QUICK_CREATE_BUTTON_CLASS).toContain('[@media(hover:none)]:opacity-100');
    expect(TAB_QUICK_CREATE_SLOT_CLASS).toContain('size-6');
    expect(TAB_QUICK_CREATE_ICON_SIZE_PX).toBe(14);
  });
});
