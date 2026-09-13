'use client';

import { useLayoutEffect, type RefObject } from 'react';
import {
  DIALOG_KEYBOARD_INSET_CSS_VAR,
  resolveVisualViewportKeyboardInset,
} from './dialog-keyboard-inset';

export function useDialogKeyboardInset(
  elementRef: RefObject<HTMLElement | null>,
  enabled: boolean,
): void {
  useLayoutEffect(() => {
    if (!enabled) return undefined;
    const element = elementRef.current;
    if (!element) return undefined;

    const sync = () => {
      const visualViewport = window.visualViewport;
      const inset = resolveVisualViewportKeyboardInset(
        window.innerHeight,
        visualViewport?.height ?? window.innerHeight,
        visualViewport?.offsetTop ?? 0,
      );
      element.style.setProperty(DIALOG_KEYBOARD_INSET_CSS_VAR, `${inset}px`);
    };

    sync();
    const visualViewport = window.visualViewport;
    visualViewport?.addEventListener('resize', sync);
    visualViewport?.addEventListener('scroll', sync);
    window.addEventListener('resize', sync);
    return () => {
      visualViewport?.removeEventListener('resize', sync);
      visualViewport?.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
      element.style.removeProperty(DIALOG_KEYBOARD_INSET_CSS_VAR);
    };
  }, [elementRef, enabled]);
}
