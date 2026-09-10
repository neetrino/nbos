import { describe, expect, it } from 'vitest';
import {
  KANBAN_TOUCH_AXIS_LOCK_PX,
  nextKanbanBoardScrollLeft,
  resolveKanbanTouchAxis,
} from './kanban-touch-axis';

describe('resolveKanbanTouchAxis', () => {
  it('stays undecided inside the lock slop', () => {
    expect(resolveKanbanTouchAxis(4, 2, KANBAN_TOUCH_AXIS_LOCK_PX)).toBe('undecided');
  });

  it('locks to x when the pan is mostly horizontal', () => {
    expect(resolveKanbanTouchAxis(24, 6, KANBAN_TOUCH_AXIS_LOCK_PX)).toBe('x');
  });

  it('locks to y when the pan is mostly vertical', () => {
    expect(resolveKanbanTouchAxis(6, 24, KANBAN_TOUCH_AXIS_LOCK_PX)).toBe('y');
  });
});

describe('nextKanbanBoardScrollLeft', () => {
  it('follows the finger without snapping to a column', () => {
    expect(nextKanbanBoardScrollLeft(0, -40, 800)).toBe(40);
    expect(nextKanbanBoardScrollLeft(40, -25, 800)).toBe(65);
  });

  it('clamps to the board edges', () => {
    expect(nextKanbanBoardScrollLeft(0, 40, 800)).toBe(0);
    expect(nextKanbanBoardScrollLeft(790, -40, 800)).toBe(800);
  });
});
