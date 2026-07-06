/** Shared lift + shadow hover for finance dashboard surface cards. */
export const FINANCE_DASHBOARD_CARD_HOVER_CLASS =
  'transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-md hover:shadow-black/[0.1] motion-reduce:transition-none motion-reduce:hover:translate-y-0';

export const FINANCE_DASHBOARD_ELEVATED_CARD_CLASS = `bg-card rounded-2xl shadow-sm shadow-black/[0.04] ring-1 ring-black/[0.04] ${FINANCE_DASHBOARD_CARD_HOVER_CLASS}`;

export const FINANCE_DASHBOARD_COMPACT_CARD_CLASS = `${FINANCE_DASHBOARD_ELEVATED_CARD_CLASS} p-5`;

export const FINANCE_DASHBOARD_PANEL_CARD_CLASS = `${FINANCE_DASHBOARD_ELEVATED_CARD_CLASS} p-6`;
