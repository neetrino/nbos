'use client';

import { useLayoutEffect, useState, type RefObject } from 'react';

export const RELATION_PICKER_DROPDOWN_GAP_PX = 4;
export const RELATION_PICKER_DROPDOWN_VIEWPORT_MARGIN_PX = 8;
export const RELATION_PICKER_DROPDOWN_MIN_HEIGHT_PX = 120;
/** ~7–8 employee rows with subtitle; actual height is capped to leftover viewport. */
export const RELATION_PICKER_DROPDOWN_PREFERRED_MAX_HEIGHT_PX = 360;

export type RelationPickerDropdownBox = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

type AnchorRect = {
  top: number;
  left: number;
  width: number;
  bottom: number;
};

type ViewportSize = {
  width: number;
  height: number;
};

/**
 * Fixed-position box for a portaled picker list so overflow parents cannot clip it.
 */
export function computeRelationPickerDropdownBox(
  anchor: AnchorRect,
  viewport: ViewportSize,
  preferredMaxHeightPx = RELATION_PICKER_DROPDOWN_PREFERRED_MAX_HEIGHT_PX,
): RelationPickerDropdownBox {
  const margin = RELATION_PICKER_DROPDOWN_VIEWPORT_MARGIN_PX;
  const gap = RELATION_PICKER_DROPDOWN_GAP_PX;
  const spaceBelow = viewport.height - anchor.bottom - gap - margin;
  const spaceAbove = anchor.top - gap - margin;
  const placeBelow =
    spaceBelow >= RELATION_PICKER_DROPDOWN_MIN_HEIGHT_PX || spaceBelow >= spaceAbove;
  const available = Math.max(0, placeBelow ? spaceBelow : spaceAbove);
  const maxHeight = Math.max(
    Math.min(RELATION_PICKER_DROPDOWN_MIN_HEIGHT_PX, available),
    Math.min(preferredMaxHeightPx, available),
  );
  const width = Math.max(0, Math.min(anchor.width, viewport.width - margin * 2));
  const left = Math.max(margin, Math.min(anchor.left, viewport.width - margin - width));

  if (placeBelow) {
    return { top: anchor.bottom + gap, left, width, maxHeight };
  }
  return {
    top: Math.max(margin, anchor.top - gap - maxHeight),
    left,
    width,
    maxHeight,
  };
}

export function useRelationPickerDropdownBox(
  anchorRef: RefObject<HTMLElement | null>,
  active: boolean,
): RelationPickerDropdownBox | null {
  const [box, setBox] = useState<RelationPickerDropdownBox | null>(null);

  useLayoutEffect(() => {
    if (!active) return;

    const update = () => {
      const element = anchorRef.current;
      if (!element) return;
      setBox(
        computeRelationPickerDropdownBox(element.getBoundingClientRect(), {
          width: window.innerWidth,
          height: window.innerHeight,
        }),
      );
    };

    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [active, anchorRef]);

  return active ? box : null;
}
