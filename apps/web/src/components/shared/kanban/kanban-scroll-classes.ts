/** Hide native scrollbar; desktop edge zones own navigation affordance. */
export const KANBAN_HORIZONTAL_SCROLL_HIDE_SCROLLBAR_CLASS =
  '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

/** CRM-style mobile board: horizontal swipe, vertical scroll stays in the column. */
export const KANBAN_BOARD_MOBILE_SCROLL_CLASS =
  'max-md:overscroll-x-contain max-md:[-webkit-overflow-scrolling:touch]';

export const KANBAN_BOARD_SCROLL_CLASS = [
  'min-h-0 min-w-0 w-full flex-1 overflow-x-scroll overflow-y-hidden pb-2',
  KANBAN_HORIZONTAL_SCROLL_HIDE_SCROLLBAR_CLASS,
  KANBAN_BOARD_MOBILE_SCROLL_CLASS,
].join(' ');
