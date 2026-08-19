import { describe, expect, it } from 'vitest';
import {
  RELATION_PICKER_DROPDOWN_GAP_PX,
  RELATION_PICKER_DROPDOWN_MIN_HEIGHT_PX,
  RELATION_PICKER_DROPDOWN_PREFERRED_MAX_HEIGHT_PX,
  RELATION_PICKER_DROPDOWN_VIEWPORT_MARGIN_PX,
  computeRelationPickerDropdownBox,
} from './relation-picker-dropdown-position';

const VIEWPORT = { width: 1200, height: 800 };

describe('computeRelationPickerDropdownBox', () => {
  it('opens below the field when there is room', () => {
    const box = computeRelationPickerDropdownBox(
      { top: 200, left: 100, width: 280, bottom: 240 },
      VIEWPORT,
    );

    expect(box.top).toBe(240 + RELATION_PICKER_DROPDOWN_GAP_PX);
    expect(box.left).toBe(100);
    expect(box.width).toBe(280);
    expect(box.maxHeight).toBe(RELATION_PICKER_DROPDOWN_PREFERRED_MAX_HEIGHT_PX);
  });

  it('opens above the field when leftover space below is too small', () => {
    const box = computeRelationPickerDropdownBox(
      { top: 700, left: 100, width: 280, bottom: 740 },
      VIEWPORT,
    );

    expect(box.top).toBe(700 - RELATION_PICKER_DROPDOWN_GAP_PX - box.maxHeight);
    expect(box.maxHeight).toBe(RELATION_PICKER_DROPDOWN_PREFERRED_MAX_HEIGHT_PX);
  });

  it('caps height to leftover viewport space', () => {
    const box = computeRelationPickerDropdownBox(
      { top: 20, left: 40, width: 240, bottom: 60 },
      { width: 800, height: 200 },
    );
    const spaceBelow =
      200 - 60 - RELATION_PICKER_DROPDOWN_GAP_PX - RELATION_PICKER_DROPDOWN_VIEWPORT_MARGIN_PX;

    expect(box.maxHeight).toBe(spaceBelow);
    expect(box.maxHeight).toBeLessThan(RELATION_PICKER_DROPDOWN_PREFERRED_MAX_HEIGHT_PX);
    expect(box.maxHeight).toBeGreaterThanOrEqual(0);
  });

  it('keeps the panel inside the viewport horizontally', () => {
    const box = computeRelationPickerDropdownBox(
      { top: 80, left: 1100, width: 280, bottom: 120 },
      VIEWPORT,
    );

    expect(box.left + box.width).toBeLessThanOrEqual(
      VIEWPORT.width - RELATION_PICKER_DROPDOWN_VIEWPORT_MARGIN_PX,
    );
    expect(box.left).toBeGreaterThanOrEqual(RELATION_PICKER_DROPDOWN_VIEWPORT_MARGIN_PX);
  });

  it('does not force a taller panel than leftover space', () => {
    const box = computeRelationPickerDropdownBox(
      { top: 4, left: 16, width: 200, bottom: 40 },
      { width: 400, height: 80 },
    );

    expect(box.maxHeight).toBeLessThan(RELATION_PICKER_DROPDOWN_MIN_HEIGHT_PX);
  });
});
