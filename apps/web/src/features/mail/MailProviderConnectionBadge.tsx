import { StatusBadge } from '@/components/shared';
import type { MailAccountHealthSummaryRow, MailAccountRow } from '@/lib/api/mail';

function providerConnectionLabel(account: MailAccountRow | MailAccountHealthSummaryRow): string {
  const connection = account.providerConnection;
  if (!connection) {
    return 'Provider not connected';
  }
  const status = connection.status.replaceAll('_', ' ').toLowerCase();
  const parts = [`${connection.providerType.replaceAll('_', ' ')} · ${status}`];
  if ('watch' in account) {
    parts.push(`watch ${account.watch.replaceAll('_', ' ')}`);
    if (account.idle === 'held' && account.idleHeartbeatAt) {
      parts.push('idle held');
    }
  }
  return parts.join(' · ');
}

export function MailProviderConnectionBadge({
  account,
}: {
  account: MailAccountRow | MailAccountHealthSummaryRow;
}) {
  const connected = account.providerConnection?.status === 'CONNECTED';
  return (
    <StatusBadge
      className="mt-1"
      label={providerConnectionLabel(account)}
      variant={connected ? 'emerald' : 'amber'}
    />
  );
}
