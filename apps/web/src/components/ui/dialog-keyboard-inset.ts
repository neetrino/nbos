/** Raised on the mobile dialog sheet so the form sits above the OS keyboard. */
export const DIALOG_KEYBOARD_INSET_CSS_VAR = '--nbos-dialog-keyboard-inset';

export function resolveVisualViewportKeyboardInset(
  innerHeight: number,
  visualHeight: number,
  visualOffsetTop: number,
): number {
  return Math.max(0, Math.round(innerHeight - visualHeight - visualOffsetTop));
}
