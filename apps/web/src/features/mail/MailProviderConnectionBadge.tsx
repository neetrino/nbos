import { StatusBadge } from '@/components/shared';
import type { MailAccountRow } from '@/lib/api/mail';

function providerConnectionLabel(account: MailAccountRow): string {
  const connection = account.providerConnection;
  if (!connection) {
    return 'Provider not connected';
  }
  const status = connection.status.replaceAll('_', ' ').toLowerCase();
  return `${connection.providerType.replaceAll('_', ' ')} · ${status}`;
}

export function MailProviderConnectionBadge({ account }: { account: MailAccountRow }) {
  const connected = account.providerConnection?.status === 'CONNECTED';
  return (
    <StatusBadge
      className="mt-1"
      label={providerConnectionLabel(account)}
      variant={connected ? 'emerald' : 'amber'}
    />
  );
}
