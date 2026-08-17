import { describe, expect, it } from 'vitest';
import {
  ENTITY_NOTES_COLLAPSED_PREVIEW_HEIGHT_PX,
  notesContentCanCollapse,
} from './entity-notes-collapse';

describe('entity-notes-collapse', () => {
  it('collapses when content is taller than the fixed preview', () => {
    expect(notesContentCanCollapse(ENTITY_NOTES_COLLAPSED_PREVIEW_HEIGHT_PX + 40)).toBe(true);
  });

  it('keeps a one-line note fully visible', () => {
    expect(notesContentCanCollapse(ENTITY_NOTES_COLLAPSED_PREVIEW_HEIGHT_PX)).toBe(false);
  });
});
