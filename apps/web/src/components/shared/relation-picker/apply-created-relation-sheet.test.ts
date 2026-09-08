import { describe, expect, it, vi } from 'vitest';
import { applyCreatedRelationSheet } from './apply-created-relation-sheet';

describe('applyCreatedRelationSheet', () => {
  it('seeds the sheet with the created entity instead of clearing it', () => {
    const setOpenId = vi.fn();
    const setSheet = vi.fn();
    const contact = { id: 'contact-1' };

    applyCreatedRelationSheet(contact, setOpenId, setSheet);

    expect(setOpenId).toHaveBeenCalledWith('contact-1');
    expect(setSheet).toHaveBeenCalledWith(contact);
    expect(setSheet).not.toHaveBeenCalledWith(null);
    expect(setOpenId.mock.invocationCallOrder[0]).toBeLessThan(setSheet.mock.invocationCallOrder[0]!);
  });
});
