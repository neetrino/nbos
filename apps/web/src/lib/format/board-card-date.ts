const BOARD_CARD_MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/** Kanban board card dates — e.g. `May 12, 2026`. */
export function formatBoardCardDate(iso: string): string {
  const dateOnly = iso.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOnly);
  if (match) {
    const year = Number(match[1]);
    const monthIndex = Number(match[2]) - 1;
    const day = Number(match[3]);
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${BOARD_CARD_MONTH_LABELS[monthIndex]} ${day}, ${year}`;
    }
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';

  return `${BOARD_CARD_MONTH_LABELS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}
