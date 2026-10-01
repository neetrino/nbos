'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { MessageSquare } from 'lucide-react';
import { DetailSheetSection } from '@/components/shared';
import { CLIENT_OPEN_CONVERSATION_QUERY } from '@/features/messenger-client/client-messenger.constants';
import { useMessengerConversationSubscription } from '@/features/messenger/realtime/use-messenger-realtime';
import { useTicketSourceMessages } from './use-ticket-source-messages';

type TicketSourceRow = NonNullable<
  ReturnType<typeof useTicketSourceMessages>['query']['data']
>[number];

export function SupportTicketSourceMessages({ ticketId }: { ticketId: string }) {
  const t = useTranslations('support');
  const { query, conversationIds } = useTicketSourceMessages(ticketId);
  const items = query.data ?? [];

  return (
    <DetailSheetSection title={t('sheet.sourceMessages')} icon={<MessageSquare size={12} />}>
      <TicketSourceSubscriptions ids={conversationIds} />
      {query.isPending ? (
        <p className="text-muted-foreground text-sm">{t('sheet.sourceLoading')}</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('sheet.noSourceMessages')}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((row) => (
            <TicketSourceRowItem key={row.referenceId} row={row} />
          ))}
        </ul>
      )}
    </DetailSheetSection>
  );
}

function TicketSourceSubscriptions({ ids }: { ids: readonly string[] }) {
  return ids.map((id) => <TicketSourceSubscription key={id} conversationId={id} />);
}

function TicketSourceSubscription({ conversationId }: { conversationId: string }) {
  useMessengerConversationSubscription(conversationId);
  return null;
}

function TicketSourceRowItem({ row }: { row: TicketSourceRow }) {
  const t = useTranslations('support');
  const href = `/client-messenger?${CLIENT_OPEN_CONVERSATION_QUERY}=${encodeURIComponent(row.sourceConversationId)}`;
  return (
    <li className="border-border rounded-lg border px-3 py-2">
      <p className="text-sm">
        {row.canOpen ? row.preview || t('sheet.emptyMessage') : t('sheet.noClientAccess')}
      </p>
      {row.canOpen ? (
        <Link href={href} className="text-primary mt-1 inline-block text-xs font-medium">
          {t('sheet.openOriginal')}
        </Link>
      ) : null}
    </li>
  );
}
