import { describe, expect, it } from 'vitest';
import {
  DIALOG_MOBILE_CLOSE_BUTTON_CLASS,
  DIALOG_MOBILE_SHEET_BODY_CLASS,
  DIALOG_MOBILE_SHEET_POPUP_CLASS,
} from './dialog-mobile-sheet';

describe('dialog mobile sheet chrome', () => {
  it('pins dialogs to the Search/Menu bottom sheet on mobile', () => {
    expect(DIALOG_MOBILE_SHEET_POPUP_CLASS).toContain('max-md:bottom-0');
    expect(DIALOG_MOBILE_SHEET_POPUP_CLASS).toContain('max-md:rounded-t-3xl');
    expect(DIALOG_MOBILE_SHEET_POPUP_CLASS).toContain('max-md:flex-col');
    expect(DIALOG_MOBILE_SHEET_POPUP_CLASS).toContain('slide-in-from-bottom');
  });

  it('scrolls the dialog body under the swipe handle', () => {
    expect(DIALOG_MOBILE_SHEET_BODY_CLASS).toContain('max-md:overflow-y-auto');
    expect(DIALOG_MOBILE_SHEET_BODY_CLASS).toContain('md:contents');
  });

  it('hides the corner close control on mobile', () => {
    expect(DIALOG_MOBILE_CLOSE_BUTTON_CLASS).toContain('max-md:hidden');
  });
});
