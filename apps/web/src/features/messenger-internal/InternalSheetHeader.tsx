'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { MessengerCoreConversationRow } from '@/lib/api/messenger-core';
import { AddToCollectionSelect } from './AddToCollectionSelect';
import { FavoriteStar, ThreadAvatar } from './InternalThreadChrome';
import { conversationTypeBadge } from './internal-messenger-section';
import { useEmployeeOnline } from './PresenceAvatar';

const HEADER_ICON_BUTTON_CLASS = 'flex items-center justify-center rounded-lg p-2';

export function SheetThreadHeader({
  conversation,
  title,
  collections,
  onToggleFavorite,
  onAddToCollection,
}: {
  conversation: MessengerCoreConversationRow;
  title: string;
  collections: Array<{ id: string; name: string }>;
  onToggleFavorite: () => void;
  onAddToCollection: (collectionId: string) => void;
}) {
  return (
    <header className="flex items-center justify-between border-b border-[#f1f5f9] bg-white py-3.5 pr-5 pl-5">
      <HeaderIdentity
        conversation={conversation}
        title={title}
        onToggleFavorite={onToggleFavorite}
      />
      <SheetHeaderActions collections={collections} onAdd={onAddToCollection} />
    </header>
  );
}

function HeaderIdentity({
  conversation,
  title,
  onToggleFavorite,
}: {
  conversation: MessengerCoreConversationRow;
  title: string;
  onToggleFavorite: () => void;
}) {
  const direct = conversation.type === 'DIRECT';
  return (
    <div className="flex min-w-0 items-center gap-3">
      <ThreadAvatar title={title} direct={direct} employeeId={conversation.peerEmployeeId} />
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate text-sm leading-[21px] font-normal text-[#0f172a]">{title}</h2>
          <span className="shrink-0 rounded-full border border-[#c7d2fe] bg-[#eef2ff] px-2 py-0.5 text-[10px] leading-[15px] text-[#4338ca]">
            {headerPill(conversation)}
          </span>
          <FavoriteStar favorite={Boolean(conversation.isFavorite)} onToggle={onToggleFavorite} />
        </div>
        {direct ? <DirectStatusLine employeeId={conversation.peerEmployeeId} /> : null}
      </div>
    </div>
  );
}

function headerPill(conversation: MessengerCoreConversationRow): string {
  const position = conversation.peerPosition?.trim();
  if (conversation.type === 'DIRECT' && position) return position;
  return conversationTypeBadge(conversation.type);
}

function DirectStatusLine({ employeeId }: { employeeId?: string | null }) {
  const online = useEmployeeOnline(employeeId);
  if (!online) return null;
  return <p className="text-xs leading-[18px] text-[#059669]">Active now</p>;
}

function SheetHeaderActions({
  collections,
  onAdd,
}: {
  collections: Array<{ id: string; name: string }>;
  onAdd: (collectionId: string) => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <div className="flex items-center">
        <HeaderIconButton label="Search" src="/messenger/sheet-header-search.svg" />
        <HeaderIconButton label="Video" src="/messenger/sheet-header-video.svg" />
      </div>
      <HeaderMore collections={collections} onAdd={onAdd} />
    </div>
  );
}

function HeaderIconButton({ label, src }: { label: string; src: string }) {
  return (
    <button type="button" aria-label={label} className={HEADER_ICON_BUTTON_CLASS}>
      <img src={src} alt="" />
    </button>
  );
}

function HeaderMore({
  collections,
  onAdd,
}: {
  collections: Array<{ id: string; name: string }>;
  onAdd: (collectionId: string) => void;
}) {
  if (collections.length === 0) {
    return <HeaderIconButton label="More" src="/messenger/sheet-header-more.svg" />;
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="More" className={HEADER_ICON_BUTTON_CLASS}>
        <img src="/messenger/sheet-header-more.svg" alt="" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 p-2">
        <AddToCollectionSelect collections={collections} onAdd={onAdd} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
