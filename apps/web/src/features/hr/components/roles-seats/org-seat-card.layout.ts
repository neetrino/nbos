/** One full-width card when only one seat is visible; extra columns as space allows. */
export const ORG_SEAT_GRID_CLASS =
  'grid w-full gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,20rem),1fr))]';

export const ORG_SEAT_CARD_CONTAINER_CLASS = '@container/org-seat w-full';

/** Show short action labels once the card is wider than an icon-only strip. */
export const ORG_SEAT_ACTION_LABEL_CLASS = 'hidden @[18rem]/org-seat:inline';

/** Name and actions share one row when the card is wide enough. */
export const ORG_SEAT_ASSIGNEE_ROW_CLASS =
  'flex flex-col gap-2 @[32rem]/org-seat:flex-row @[32rem]/org-seat:items-center @[32rem]/org-seat:justify-between';
