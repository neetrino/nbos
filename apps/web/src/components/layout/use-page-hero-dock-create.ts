import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import type { MobileDockCreateAction } from './mobile-module-dock-types';
import { resolvePageHeroCreateButton } from './resolve-page-hero-create-button';

export function usePageHeroDockCreate(
  hostRef: RefObject<HTMLElement | null>,
  explicitCreate?: MobileDockCreateAction,
): MobileDockCreateAction | undefined {
  const [inferred, setInferred] = useState<MobileDockCreateAction | undefined>(undefined);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const disabledRef = useRef<boolean | undefined>(undefined);

  useLayoutEffect(() => {
    if (explicitCreate) {
      buttonRef.current = null;
      setInferred(undefined);
      return;
    }
    const button = hostRef.current ? resolvePageHeroCreateButton(hostRef.current) : null;
    if (buttonRef.current === button && disabledRef.current === button?.disabled) return;
    buttonRef.current = button;
    disabledRef.current = button?.disabled;
    setInferred(
      button
        ? {
            onSelect: () => button.click(),
            disabled: button.disabled,
          }
        : undefined,
    );
  });

  return explicitCreate ?? inferred;
}
