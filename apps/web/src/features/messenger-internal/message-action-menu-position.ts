import {
  MESSAGE_ACTION_MENU_VIEW_PAD_PX,
  MESSAGE_ACTION_MENU_WIDTH_PX,
  SHEET_MESSAGE_BUBBLE_ATTR,
} from './internal-messenger.constants';

export function pointForMessageActionMenu(
  row: HTMLElement,
  mine: boolean,
): { x: number; y: number } {
  const bubble = row.querySelector(`[${SHEET_MESSAGE_BUBBLE_ATTR}]`);
  const rect = (bubble instanceof HTMLElement ? bubble : row).getBoundingClientRect();
  const rawX = mine ? rect.right - MESSAGE_ACTION_MENU_WIDTH_PX : rect.left;
  const maxX = window.innerWidth - MESSAGE_ACTION_MENU_WIDTH_PX - MESSAGE_ACTION_MENU_VIEW_PAD_PX;
  return {
    x: clamp(rawX, MESSAGE_ACTION_MENU_VIEW_PAD_PX, maxX),
    y: clamp(
      rect.top,
      MESSAGE_ACTION_MENU_VIEW_PAD_PX,
      window.innerHeight - MESSAGE_ACTION_MENU_VIEW_PAD_PX,
    ),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
