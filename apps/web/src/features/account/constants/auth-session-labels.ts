import type { AuthSessionClientKind } from '@/lib/api/auth';

export const AUTH_SESSION_CLIENT_LABELS: Record<AuthSessionClientKind, string> = {
  web: 'Web',
  mobile_work: 'Work app',
  mobile_messenger: 'Messenger',
  mobile_vault: 'Vault',
};

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export function formatSessionActivity(iso: string | null, current: boolean): string {
  if (current) return 'This device';
  if (!iso) return 'Unknown activity';
  const delta = Date.now() - Date.parse(iso);
  if (!Number.isFinite(delta) || delta < MINUTE_MS) return 'Active now';
  if (delta < HOUR_MS) return `${Math.floor(delta / MINUTE_MS)} min ago`;
  if (delta < DAY_MS) return `${Math.floor(delta / HOUR_MS)}h ago`;
  return `${Math.floor(delta / DAY_MS)}d ago`;
}
