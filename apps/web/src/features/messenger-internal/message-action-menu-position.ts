import {
  MESSAGE_ACTION_MENU_HEIGHT_PX,
  MESSAGE_ACTION_MENU_VIEW_PAD_PX,
  MESSAGE_ACTION_MENU_WIDTH_PX,
  SHEET_MESSAGE_BUBBLE_ATTR,
} from './internal-messenger.constants';

export function pointForMessageActionMenu(row: HTMLElement): { x: number; y: number } {
  const bubble = row.querySelector(`[${SHEET_MESSAGE_BUBBLE_ATTR}]`);
  const rect = (bubble instanceof HTMLElement ? bubble : row).getBoundingClientRect();
  const maxX = window.innerWidth - MESSAGE_ACTION_MENU_WIDTH_PX - MESSAGE_ACTION_MENU_VIEW_PAD_PX;
  const floor = window.innerHeight - MESSAGE_ACTION_MENU_VIEW_PAD_PX;
  const opensUp = rect.top + MESSAGE_ACTION_MENU_HEIGHT_PX > floor;
  const rawY = opensUp ? rect.bottom - MESSAGE_ACTION_MENU_HEIGHT_PX : rect.top;
  return {
    x: clamp(rect.left, MESSAGE_ACTION_MENU_VIEW_PAD_PX, maxX),
    y: clamp(rawY, MESSAGE_ACTION_MENU_VIEW_PAD_PX, floor - MESSAGE_ACTION_MENU_HEIGHT_PX),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
