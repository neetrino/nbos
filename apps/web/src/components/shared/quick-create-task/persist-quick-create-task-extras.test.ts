import { describe, expect, it, vi } from 'vitest';
import { hasPersistableChecklist } from './persist-quick-create-task-extras';

vi.mock('@/lib/api/tasks', () => ({
  tasksApi: {
    createChecklist: vi.fn(),
    addChecklistItem: vi.fn(),
    toggleChecklistItem: vi.fn(),
  },
}));

vi.mock('@/features/drive/drive-entity-upload', () => ({
  uploadDriveFilesToEntity: vi.fn(),
}));

describe('hasPersistableChecklist', () => {
  it('skips a completely empty draft list', () => {
    expect(hasPersistableChecklist({ localId: 'c1', title: '   ', items: [] })).toBe(false);
  });

  it('keeps a list that has items', () => {
    expect(hasPersistableChecklist({ localId: 'c1', title: 'Checklist 1', items: [] })).toBe(false);
    expect(
      hasPersistableChecklist({
        localId: 'c1',
        title: '',
        items: [{ localId: 'i1', text: 'Ship', checked: false }],
      }),
    ).toBe(true);
  });
});
