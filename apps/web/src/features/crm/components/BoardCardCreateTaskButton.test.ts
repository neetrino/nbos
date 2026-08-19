import { describe, expect, it, vi } from 'vitest';
import {
  getBoardCardCreateTaskSlotClassName,
  stopBoardCardCreateTaskClick,
} from './BoardCardCreateTaskButton';

describe('BoardCardCreateTaskButton helpers', () => {
  it('stops card click and forwards the create callback', () => {
    const stopPropagation = vi.fn();
    const onCreateTask = vi.fn();

    stopBoardCardCreateTaskClick({ stopPropagation }, onCreateTask);

    expect(stopPropagation).toHaveBeenCalledOnce();
    expect(onCreateTask).toHaveBeenCalledOnce();
  });

  it('pins the create-task slot to the bottom-right, not the top', () => {
    const slotClass = getBoardCardCreateTaskSlotClassName();

    expect(slotClass).toContain('ml-auto');
    expect(slotClass).toContain('self-end');
    expect(slotClass).not.toContain('self-start');
    expect(slotClass).not.toContain('top-');
  });
});
