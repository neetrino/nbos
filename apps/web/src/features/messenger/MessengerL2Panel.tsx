import { Hash, MessageCircle, ListTodo, Briefcase, Box } from 'lucide-react';
import type { MessengerL2ConversationRow, MessengerUnifiedSearchResultRow } from '@/lib/api/messenger';
import { MESSENGER_CONVERSATION_TYPE_LABEL } from './messenger-internal.constants';
import { MESSENGER_SIDEBAR_UNREAD_DISPLAY_MAX } from './messenger-sidebar.constants';
import type { MessengerL2LoadState } from './useMessengerNavigation';

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  const label =
    count > MESSENGER_SIDEBAR_UNREAD_DISPLAY_MAX
      ? `${MESSENGER_SIDEBAR_UNREAD_DISPLAY_MAX}+`
      : String(count);
  return (
    <span className="ml-auto min-w-[1.25rem] shrink-0 rounded-full bg-[#E5A84B] px-1.5 py-0.5 text-center text-[10px] font-semibold text-white tabular-nums">
      {label}
    </span>
  );
}

function typeIcon(type: string) {
  switch (type) {
    case 'TASK':
      return <ListTodo size={14} className="mt-0.5 shrink-0 text-emerald-600" />;
    case 'DEAL':
      return <Briefcase size={14} className="mt-0.5 shrink-0 text-sky-700" />;
    case 'PRODUCT':
      return <Box size={14} className="mt-0.5 shrink-0 text-indigo-600" />;
    case 'DIRECT':
      return <MessageCircle size={14} className="mt-0.5 shrink-0 text-black/45" />;
    default:
      return <Hash size={14} className="mt-0.5 shrink-0 text-black/45" />;
  }
}

export function MessengerL2Panel({
  conversations,
  activeConversationId,
  onSelect,
  searchResults,
  onSelectSearchResult,
  emptyHint,
  loadState,
  errorMessage,
}: {
  conversations: MessengerL2ConversationRow[];
  activeConversationId: string | null;
  onSelect: (conversation: MessengerL2ConversationRow) => void;
  searchResults: MessengerUnifiedSearchResultRow[];
  onSelectSearchResult: (result: MessengerUnifiedSearchResultRow) => void;
  emptyHint: string;
  loadState: MessengerL2LoadState;
  errorMessage: string | null;
}) {
  return (
    <aside className="flex min-h-0 w-64 shrink-0 flex-col border-r border-black/[0.06] bg-[#FAFAF7]">
      <div className="flex-1 overflow-y-auto px-2 py-3">
        {searchResults.length > 0 ? (
          <>
            <p className="px-2 pb-1 text-[11px] font-semibold tracking-wider text-black/40 uppercase">
              Search
            </p>
            {searchResults.slice(0, 8).map((result) => (
              <button
                key={result.messageId}
                type="button"
                onClick={() => onSelectSearchResult(result)}
                className="mb-0.5 flex w-full flex-col rounded-lg px-2 py-2 text-left hover:bg-black/[0.04]"
              >
                <span className="truncate text-sm font-medium text-black">
                  {result.conversationTitle}
                </span>
                <span className="truncate text-[11px] text-black/45">
                  {result.senderName}: {result.content}
                </span>
              </button>
            ))}
          </>
        ) : null}

        <p className="px-2 pt-1 pb-1 text-[11px] font-semibold tracking-wider text-black/40 uppercase">
          Topics
        </p>
        {loadState === 'loading' || loadState === 'idle' ? (
          <p className="px-2 py-4 text-sm text-black/40">
            {loadState === 'loading' ? 'Loading topics…' : emptyHint}
          </p>
        ) : null}
        {loadState === 'error' ? (
          <p className="px-2 py-4 text-sm text-amber-800">
            {errorMessage ?? 'Failed to load topics.'}
          </p>
        ) : null}
        {loadState === 'success' && conversations.length === 0 ? (
          <p className="px-2 py-4 text-sm text-black/40">{emptyHint}</p>
        ) : null}
        {loadState === 'success'
          ? conversations.map((c) => {
              const active = activeConversationId === c.id;
              const typeLabel = MESSENGER_CONVERSATION_TYPE_LABEL[c.type] ?? c.type;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelect(c)}
                  className={`mb-0.5 flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left transition-colors ${
                    active ? 'bg-white shadow-sm ring-1 ring-black/[0.06]' : 'hover:bg-white/70'
                  }`}
                >
                  {typeIcon(c.type)}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-black">{c.title}</span>
                    <span className="block truncate text-[11px] text-black/45">
                      {typeLabel}
                      {c.lastMessagePreview ? ` · ${c.lastMessagePreview}` : ''}
                    </span>
                  </span>
                  <UnreadBadge count={c.unreadCount} />
                </button>
              );
            })
          : null}
      </div>
    </aside>
  );
}
