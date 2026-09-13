import { describe, expect, it } from 'vitest';
import { consumeQuickCreateChecklistDismiss } from './quick-create-task-layer';

describe('consumeQuickCreateChecklistDismiss', () => {
  it('keeps the create dialog open while the checklist layer is showing', () => {
    expect(consumeQuickCreateChecklistDismiss(true)).toBe(true);
  });

  it('lets the create dialog close when no checklist layer is showing', () => {
    expect(consumeQuickCreateChecklistDismiss(false)).toBe(false);
  });
});
