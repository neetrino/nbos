import { describe, expect, it } from 'vitest';
import { shouldCloseNotesEditorAfterBlur } from './entity-notes-edit-focus';

function mockShell(contained: object) {
  return {
    contains: (node: object) => node === contained,
  } as HTMLElement;
}

describe('shouldCloseNotesEditorAfterBlur', () => {
  it('stays open while activate is settling', () => {
    const outside = {};
    expect(
      shouldCloseNotesEditorAfterBlur({
        activating: true,
        shell: mockShell({}),
        activeElement: outside as Element,
      }),
    ).toBe(false);
  });

  it('stays open when focus is still inside the shell', () => {
    const inside = {};
    expect(
      shouldCloseNotesEditorAfterBlur({
        activating: false,
        shell: mockShell(inside),
        activeElement: inside as Element,
      }),
    ).toBe(false);
  });

  it('closes when focus left the shell', () => {
    const outside = {};
    expect(
      shouldCloseNotesEditorAfterBlur({
        activating: false,
        shell: mockShell({}),
        activeElement: outside as Element,
      }),
    ).toBe(true);
  });

  it('stays open when there is no active element yet', () => {
    expect(
      shouldCloseNotesEditorAfterBlur({
        activating: false,
        shell: mockShell({}),
        activeElement: null,
      }),
    ).toBe(false);
  });
});
