/** Initial cards per kanban column; further rows load on column scroll. */
export const KANBAN_COLUMN_PAGE_SIZE = 7;

/**
 * Column IntersectionObserver rootMargin. Tall kanban cards are ~250px;
 * this starts the next page ~3 cards before the visible bottom so scroll
 * does not stall at the end of the loaded list.
 */
export const KANBAN_COLUMN_LOAD_MORE_ROOT_MARGIN = '720px';
