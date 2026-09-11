/** Shared visual tokens for Product WhatsApp settings surfaces. */
export const WA_ACCENT_ICON_WRAP =
  'flex size-7 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400';

/** Header mark sized to match title + description block height. */
export const WA_HEADER_ICON_WRAP =
  'flex aspect-square h-full min-h-12 w-auto shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400';

export const WA_SECTION_CARD = 'border-border bg-card rounded-xl border p-4 shadow-none';

export const WA_COMPACT_SECTION_CARD = 'border-border bg-card rounded-lg border p-3 shadow-none';

export const WA_COMPACT_FIELD = 'h-8 text-sm';

export const WA_ACTION_STACK = 'flex flex-col gap-1.5';

export const WA_ACTION_CARD =
  'border-border bg-card hover:bg-muted/40 flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors disabled:pointer-events-none disabled:opacity-50';

export const WA_OUTLINE_ACTION_BUTTON =
  'border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-400 dark:hover:bg-emerald-950/40';

export const WHATSAPP_GATEWAY_SETTINGS_HREF = '/settings/integrations';

export const RECENT_OPERATIONS_PREVIEW_COUNT = 3;

/** Short status copy for the Product settings status row. */
export function productWhatsAppStatusLabel(status: string): string {
  if (status === 'ACTIVE') return 'Active';
  if (status === 'FAILED') return 'Group failed';
  if (
    status === 'PENDING' ||
    status === 'CREATING' ||
    status === 'QUEUED' ||
    status === 'PROCESSING'
  ) {
    return 'Group pending';
  }
  if (status === 'OUTCOME_UNKNOWN' || status === 'NEEDS_RECONCILIATION') {
    return 'Group unresolved';
  }
  return 'Group not created';
}

export function formatProductWhatsAppTimestamp(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}
