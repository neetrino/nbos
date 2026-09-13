import { describe, expect, it } from 'vitest';
import { resolveQuickCreateTextareaEnter } from './quick-create-task-enter';

describe('resolveQuickCreateTextareaEnter', () => {
  it('advances from the title on Enter and never inserts a newline there', () => {
    expect(
      resolveQuickCreateTextareaEnter({ key: 'Enter', metaKey: false, ctrlKey: false }, 'title'),
    ).toBe('advance');
  });

  it('inserts a newline in the description on Enter', () => {
    expect(
      resolveQuickCreateTextareaEnter(
        { key: 'Enter', metaKey: false, ctrlKey: false },
        'description',
      ),
    ).toBe('newline');
  });

  it('submits from either field on Cmd or Ctrl+Enter', () => {
    expect(
      resolveQuickCreateTextareaEnter({ key: 'Enter', metaKey: true, ctrlKey: false }, 'title'),
    ).toBe('submit');
    expect(
      resolveQuickCreateTextareaEnter(
        { key: 'Enter', metaKey: false, ctrlKey: true },
        'description',
      ),
    ).toBe('submit');
  });

  it('ignores keys other than Enter', () => {
    expect(
      resolveQuickCreateTextareaEnter({ key: 'Tab', metaKey: false, ctrlKey: false }, 'title'),
    ).toBe('ignore');
  });
});
