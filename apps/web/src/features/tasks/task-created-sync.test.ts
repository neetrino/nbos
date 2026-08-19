import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dispatchTaskCreated, subscribeTaskCreated } from './task-created-sync';
import type { Task } from '@/lib/api/tasks';

function taskStub(id: string): Task {
  return { id } as Task;
}

describe('task-created-sync', () => {
  beforeEach(() => {
    const target = new EventTarget();
    vi.stubGlobal('window', {
      addEventListener: target.addEventListener.bind(target),
      removeEventListener: target.removeEventListener.bind(target),
      dispatchEvent: target.dispatchEvent.bind(target),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('delivers created tasks to subscribers', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeTaskCreated(listener);
    const task = taskStub('t1');

    dispatchTaskCreated(task);

    expect(listener).toHaveBeenCalledWith(task);
    unsubscribe();
  });
});
