import { describe, expect, it, vi } from 'vitest';
import { createTaskKanbanQuickCreateConfig } from './tasks-kanban-quick-create';

describe('createTaskKanbanQuickCreateConfig', () => {
  it('hides the column Quick button on mobile', () => {
    const config = createTaskKanbanQuickCreateConfig(vi.fn());
    expect(config.hideOnMobile).toBe(true);
    expect(config.buttonLabel).toBe('Quick');
  });
});
