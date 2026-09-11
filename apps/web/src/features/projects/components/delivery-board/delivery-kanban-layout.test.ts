import { describe, expect, it } from 'vitest';
import {
  DELIVERY_KANBAN_COLUMN_GAP_PX,
  DELIVERY_KANBAN_COLUMN_WIDTH_PX,
  deliveryKanbanBoardMinWidthPx,
} from './delivery-kanban-layout';
import { KANBAN_BOARD_SCROLL_CLASS } from '@/components/shared/kanban/kanban-scroll-classes';

describe('deliveryKanbanBoardMinWidthPx', () => {
  it('uses the desktop column width by default', () => {
    expect(deliveryKanbanBoardMinWidthPx(4)).toBe(
      4 * (DELIVERY_KANBAN_COLUMN_WIDTH_PX + DELIVERY_KANBAN_COLUMN_GAP_PX),
    );
  });

  it('uses the resolved mobile column width when provided', () => {
    expect(deliveryKanbanBoardMinWidthPx(4, 360)).toBe(4 * (360 + DELIVERY_KANBAN_COLUMN_GAP_PX));
  });
});

describe('delivery kanban scroll chrome', () => {
  it('shares the CRM horizontal board scroller', () => {
    expect(KANBAN_BOARD_SCROLL_CLASS).toContain('overflow-x-scroll');
    expect(KANBAN_BOARD_SCROLL_CLASS).toContain('max-md:overscroll-x-contain');
  });
});
