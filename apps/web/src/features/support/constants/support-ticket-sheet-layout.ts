import { SHEET_MOBILE_FLOATING_RAIL_ANCHOR_CLASS } from '@/components/shared/detail-sheet-classes';

/**
 * Support ticket detail sheet — 85vw on mobile, half viewport on desktop.
 */
export const SUPPORT_TICKET_SHEET_CONTENT_CLASS =
  'flex h-[calc(100vh-2.5vh)] max-h-[calc(100vh-2.5vh)] w-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:h-[calc(100vh-2.5vh)] data-[side=right]:w-[85vw] sm:max-w-none sm:data-[side=right]:w-[50vw]';

export const SUPPORT_TICKET_SHEET_RAIL_ANCHOR_CLASS = `${SHEET_MOBILE_FLOATING_RAIL_ANCHOR_CLASS} sm:right-[50vw]`;
