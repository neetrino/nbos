/** One full-width card when only one seat is visible; extra columns as space allows. */
export const ORG_SEAT_GRID_CLASS =
  'grid w-full content-start gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,20rem),1fr))]';

export const ORG_SEAT_CARD_CONTAINER_CLASS = '@container/org-seat w-full';

/** Labels need ~24rem so three Russian action chips stay inside the inner box. */
export const ORG_SEAT_ACTION_LABEL_CLASS = 'hidden @[24rem]/org-seat:inline';

/** Wrap instead of overflowing the rounded assignee panel. */
export const ORG_SEAT_ACTIONS_CLASS = 'flex min-w-0 max-w-full flex-wrap items-center gap-1';

/** Name and actions share one row when the card is wide enough. */
export const ORG_SEAT_ASSIGNEE_ROW_CLASS =
  'flex min-w-0 flex-col gap-2 overflow-hidden @[32rem]/org-seat:flex-row @[32rem]/org-seat:items-center @[32rem]/org-seat:justify-between';
