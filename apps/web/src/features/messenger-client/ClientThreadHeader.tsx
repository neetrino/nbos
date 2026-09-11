'use client';

import { Globe, Star } from 'lucide-react';
import type { MessengerClientConversationRow } from '@/lib/api/messenger-core-client';
import { ClientAttentionAssign } from './ClientAttentionAssign';
import { uniqueAttentionLabels } from './client-attention-view';
import { clientProviderLabel } from './client-messenger-section';

export function ClientThreadHeader({
  conversation,
  title,
  collections,
  viewedProductId,
  onToggleFavorite,
  onAddToCollection,
  onInvite,
  onAttentionChange,
}: {
  conversation: MessengerClientConversationRow;
  title: string;
  collections: Array<{ id: string; name: string }>;
  viewedProductId: string | null;
  onToggleFavorite: () => void;
  onAddToCollection: (collectionId: string) => void;
  onInvite: () => void;
  onAttentionChange?: (attention: NonNullable<MessengerClientConversationRow['attention']>) => void;
}) {
  const attentionLabel = uniqueAttentionLabels(conversation.attention);
  return (
    <header className="flex items-center gap-3 border-b border-teal-900/10 px-5 py-3">
      <Globe size={16} className="text-teal-800" />
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-sm font-semibold text-black">{title}</h2>
        <p className="text-[11px] text-teal-900/70">
          {clientProviderLabel(conversation.provider)} · Client Messenger
          {attentionLabel ? ` · ${attentionLabel}` : ''}
        </p>
      </div>
      {onAttentionChange && (conversation.canSend || conversation.canWrite) ? (
        <ClientAttentionAssign
          key={conversation.id}
          conversation={conversation}
          viewedProductId={viewedProductId}
          onAssigned={onAttentionChange}
        />
      ) : null}
      <button
        type="button"
        onClick={onInvite}
        className="rounded-lg px-2 py-1 text-[11px] font-medium text-teal-900 hover:bg-teal-800/10"
      >
        Invite specialist
      </button>
      <button
        type="button"
        aria-label={conversation.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
        onClick={onToggleFavorite}
        className="rounded-lg p-1.5 text-black/35 hover:bg-teal-800/10 hover:text-teal-800"
      >
        <Star size={16} className={conversation.isFavorite ? 'fill-teal-800 text-teal-800' : ''} />
      </button>
      {collections.length > 0 ? (
        <CollectionSelect collections={collections} onAddToCollection={onAddToCollection} />
      ) : null}
    </header>
  );
}

function CollectionSelect({
  collections,
  onAddToCollection,
}: {
  collections: Array<{ id: string; name: string }>;
  onAddToCollection: (collectionId: string) => void;
}) {
  return (
    <select
      aria-label="Add to Client collection"
      defaultValue=""
      className="max-w-[10rem] rounded-lg border border-teal-900/10 bg-[#F4F7F7] px-2 py-1 text-[11px] text-black"
      onChange={(event) => {
        const collectionId = event.target.value;
        if (!collectionId) return;
        onAddToCollection(collectionId);
        event.target.value = '';
      }}
    >
      <option value="">Add to collection</option>
      {collections.map((collection) => (
        <option key={collection.id} value={collection.id}>
          {collection.name}
        </option>
      ))}
    </select>
  );
}
