const DELIVERY_BOARD_CARD_MONTH_LABELS = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
] as const;

/** Delivery board card dates only — e.g. `MAY 12, 2026`. */
export function formatDeliveryBoardCardDate(iso: string): string {
  const dateOnly = iso.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOnly);
  if (match) {
    const year = Number(match[1]);
    const monthIndex = Number(match[2]) - 1;
    const day = Number(match[3]);
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${DELIVERY_BOARD_CARD_MONTH_LABELS[monthIndex]} ${day}, ${year}`;
    }
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';

  return `${DELIVERY_BOARD_CARD_MONTH_LABELS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}
