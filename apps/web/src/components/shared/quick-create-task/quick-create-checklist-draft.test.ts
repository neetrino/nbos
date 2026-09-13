import { describe, expect, it } from 'vitest';
import {
  addQuickCreateChecklistItem,
  createQuickCreateChecklist,
  renameQuickCreateChecklist,
  toggleQuickCreateChecklistItem,
} from './quick-create-checklist-draft';

describe('quick-create-checklist-draft', () => {
  it('names the first list Checklist 1', () => {
    expect(createQuickCreateChecklist([]).title).toBe('Checklist 1');
  });

  it('adds a trimmed item and ignores blanks', () => {
    const list = createQuickCreateChecklist([]);
    expect(addQuickCreateChecklistItem([list], list.localId, '  ').length).toBe(1);
    const next = addQuickCreateChecklistItem([list], list.localId, '  Ship  ');
    expect(next[0]?.items).toEqual([expect.objectContaining({ text: 'Ship', checked: false })]);
  });

  it('toggles and renames a list', () => {
    const list = createQuickCreateChecklist([]);
    const withItem = addQuickCreateChecklistItem([list], list.localId, 'A');
    const itemId = withItem[0]?.items[0]?.localId ?? '';
    const toggled = toggleQuickCreateChecklistItem(withItem, list.localId, itemId);
    expect(toggled[0]?.items[0]?.checked).toBe(true);
    expect(renameQuickCreateChecklist(toggled, list.localId, 'QA')[0]?.title).toBe('QA');
  });
});
