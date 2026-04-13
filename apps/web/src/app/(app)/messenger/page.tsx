'use client';

import { useState, useRef, useEffect } from 'react';
import { Hash, Search, Send } from 'lucide-react';
import {
  CHANNELS,
  DM_USERS,
  GENERAL_MESSAGES,
  formatTime,
  getDateLabel,
  type Channel,
  type DmUser,
  type Message,
} from './_data';

type ActiveView = { type: 'channel'; id: string } | { type: 'dm'; userId: string };

function Avatar({ initials }: { initials: string }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E5A84B]/15 text-sm font-semibold text-[#E5A84B]">
      {initials}
    </div>
  );
}

function DateDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-2">
      <div className="h-px flex-1 bg-black/[0.06]" />
      <span className="text-xs font-medium text-black/40">{label}</span>
      <div className="h-px flex-1 bg-black/[0.06]" />
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  return (
    <div className="group flex gap-3 px-5 py-1.5 hover:bg-black/[0.02]">
      <Avatar initials={message.initials} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-black">{message.senderName}</span>
          <span className="text-xs text-black/35">{formatTime(message.timestamp)}</span>
        </div>
        <p className="text-sm leading-relaxed text-black/75">{message.content}</p>
      </div>
    </div>
  );
}

function Sidebar({
  active,
  onSelect,
  search,
  onSearchChange,
}: {
  active: ActiveView;
  onSelect: (v: ActiveView) => void;
  search: string;
  onSearchChange: (v: string) => void;
}) {
  const filteredChannels = CHANNELS.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredUsers = DM_USERS.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-black/[0.06] bg-white">
      <div className="p-3">
        <div className="relative">
          <Search size={15} className="absolute top-1/2 left-2.5 -translate-y-1/2 text-black/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search..."
            className="w-full rounded-lg border border-black/[0.08] bg-[#F5F5F0] py-1.5 pr-3 pl-8 text-sm text-black placeholder:text-black/35 focus:ring-2 focus:ring-[#E5A84B]/30 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        <p className="px-2 pt-3 pb-1 text-[11px] font-semibold tracking-wider text-black/40 uppercase">
          Channels
        </p>
        {filteredChannels.map((ch) => {
          const isActive = active.type === 'channel' && active.id === ch.id;
          return (
            <button
              key={ch.id}
              onClick={() => onSelect({ type: 'channel', id: ch.id })}
              className={`mb-0.5 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${
                isActive
                  ? 'bg-[#E5A84B]/10 font-medium text-black'
                  : 'text-black/60 hover:bg-black/[0.03]'
              }`}
            >
              <Hash size={15} className={isActive ? 'text-[#E5A84B]' : 'text-black/30'} />
              {ch.name}
            </button>
          );
        })}

        <p className="px-2 pt-4 pb-1 text-[11px] font-semibold tracking-wider text-black/40 uppercase">
          Direct Messages
        </p>
        {filteredUsers.map((user) => {
          const isActive = active.type === 'dm' && active.userId === user.id;
          return (
            <button
              key={user.id}
              onClick={() => onSelect({ type: 'dm', userId: user.id })}
              className={`mb-0.5 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${
                isActive
                  ? 'bg-[#E5A84B]/10 font-medium text-black'
                  : 'text-black/60 hover:bg-black/[0.03]'
              }`}
            >
              <span className="relative flex h-5 w-5 items-center justify-center">
                <span className="text-[10px] font-medium">{user.initials}</span>
                <span
                  className={`absolute -right-0.5 -bottom-0.5 h-2 w-2 rounded-full border border-white ${
                    user.online ? 'bg-emerald-400' : 'bg-black/20'
                  }`}
                />
              </span>
              {user.name}
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function MessageArea({
  active,
  messages,
  newMessage,
  onNewMessageChange,
  onSend,
}: {
  active: ActiveView;
  messages: Message[];
  newMessage: string;
  onNewMessageChange: (v: string) => void;
  onSend: () => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const channel = active.type === 'channel' ? CHANNELS.find((c) => c.id === active.id) : null;
  const dmUser = active.type === 'dm' ? DM_USERS.find((u) => u.id === active.userId) : null;

  const grouped: { label: string; items: Message[] }[] = [];
  let currentLabel = '';
  for (const msg of messages) {
    const label = getDateLabel(msg.timestamp);
    if (label !== currentLabel) {
      currentLabel = label;
      grouped.push({ label, items: [] });
    }
    const lastGroup = grouped[grouped.length - 1];
    if (lastGroup) lastGroup.items.push(msg);
  }

  const placeholder = channel ? `Message #${channel.name}` : `Message ${dmUser?.name ?? ''}`;

  return (
    <div className="flex flex-1 flex-col bg-white">
      <div className="flex items-center gap-3 border-b border-black/[0.06] px-5 py-3">
        {channel && (
          <>
            <Hash size={18} className="text-[#E5A84B]" />
            <div>
              <h2 className="text-sm font-semibold text-black">{channel.name}</h2>
              <p className="text-xs text-black/40">
                {channel.memberCount} members &middot; {channel.description}
              </p>
            </div>
          </>
        )}
        {dmUser && (
          <>
            <Avatar initials={dmUser.initials} />
            <div>
              <h2 className="text-sm font-semibold text-black">{dmUser.name}</h2>
              <p className="text-xs text-black/40">{dmUser.online ? 'Online' : 'Offline'}</p>
            </div>
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-black/30">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.label}>
              <DateDivider label={group.label} />
              {group.items.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-black/[0.06] px-5 py-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => onNewMessageChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder={placeholder}
            className="flex-1 rounded-lg border border-black/[0.08] bg-[#F5F5F0] px-3 py-2 text-sm text-black placeholder:text-black/35 focus:ring-2 focus:ring-[#E5A84B]/30 focus:outline-none"
          />
          <button
            onClick={onSend}
            disabled={!newMessage.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E5A84B] text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MessengerPage() {
  const [active, setActive] = useState<ActiveView>({ type: 'channel', id: 'ch-general' });
  const [search, setSearch] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [localMessages, setLocalMessages] = useState<Record<string, Message[]>>({});

  const viewKey = active.type === 'channel' ? active.id : `dm-${active.userId}`;

  const baseMessages =
    active.type === 'channel' && active.id === 'ch-general' ? GENERAL_MESSAGES : [];
  const allMessages = [...baseMessages, ...(localMessages[viewKey] ?? [])];

  const handleSend = () => {
    if (!newMessage.trim()) return;
    const msg: Message = {
      id: `local-${Date.now()}`,
      senderId: 'u-me',
      senderName: 'You',
      initials: 'ME',
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
    };
    setLocalMessages((prev) => ({
      ...prev,
      [viewKey]: [...(prev[viewKey] ?? []), msg],
    }));
    setNewMessage('');
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden rounded-2xl border border-black/[0.06] bg-[#F5F5F0]">
      <Sidebar active={active} onSelect={setActive} search={search} onSearchChange={setSearch} />
      <MessageArea
        active={active}
        messages={allMessages}
        newMessage={newMessage}
        onNewMessageChange={setNewMessage}
        onSend={handleSend}
      />
    </div>
  );
}
