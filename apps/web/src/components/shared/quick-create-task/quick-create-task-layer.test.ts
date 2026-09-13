import { describe, expect, it } from 'vitest';
import { consumeQuickCreateLayerDismiss } from './quick-create-task-layer';

describe('consumeQuickCreateLayerDismiss', () => {
  it('keeps the create dialog open while a layer is showing', () => {
    expect(consumeQuickCreateLayerDismiss(true)).toBe(true);
  });

  it('lets the create dialog close when no layer is showing', () => {
    expect(consumeQuickCreateLayerDismiss(false)).toBe(false);
  });
});
