import { describe, expect, it } from 'vitest';
import {
  normalizeTaskStatusForBoardScope,
  taskMatchesTaskBoardScope,
} from './task-board-lifecycle';

describe('task-board-lifecycle', () => {
  it('normalizes NEW and DONE for scope matching', () => {
    expect(normalizeTaskStatusForBoardScope('NEW')).toBe('OPEN');
    expect(normalizeTaskStatusForBoardScope('DONE')).toBe('COMPLETED');
    expect(normalizeTaskStatusForBoardScope('REVIEW')).toBe('REVIEW');
  });

  it('active scope excludes completed tasks', () => {
    expect(taskMatchesTaskBoardScope('IN_PROGRESS', 'ACTIVE')).toBe(true);
    expect(taskMatchesTaskBoardScope('COMPLETED', 'ACTIVE')).toBe(false);
    expect(taskMatchesTaskBoardScope('DONE', 'ACTIVE')).toBe(false);
  });

  it('closed scope includes only terminal tasks', () => {
    expect(taskMatchesTaskBoardScope('COMPLETED', 'CLOSED')).toBe(true);
    expect(taskMatchesTaskBoardScope('OPEN', 'CLOSED')).toBe(false);
  });
});
