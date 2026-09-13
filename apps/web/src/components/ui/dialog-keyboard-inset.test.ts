import { describe, expect, it } from 'vitest';
import { resolveVisualViewportKeyboardInset } from './dialog-keyboard-inset';

describe('resolveVisualViewportKeyboardInset', () => {
  it('is zero when the visual viewport fills the layout viewport', () => {
    expect(resolveVisualViewportKeyboardInset(800, 800, 0)).toBe(0);
  });

  it('returns the keyboard overlap when the visual viewport shrinks', () => {
    expect(resolveVisualViewportKeyboardInset(800, 480, 0)).toBe(320);
  });

  it('subtracts a scrolled visual offset', () => {
    expect(resolveVisualViewportKeyboardInset(800, 480, 40)).toBe(280);
  });
});
