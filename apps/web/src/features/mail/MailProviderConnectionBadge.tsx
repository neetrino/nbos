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
    <span
      className={`mt-1 inline-flex w-fit rounded-full px-2 py-0.5 text-[11px] font-medium ${
        connected ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
      }`}
    >
      {providerConnectionLabel(account)}
    </span>
  );
}
