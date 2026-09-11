'use client';

import { Copy, Search, User, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type WhatsAppGatewayChatItem, type WhatsAppGatewayChatType } from '@/lib/api/whatsapp';
import { cn } from '@/lib/utils';
import { resolveDirectoryChatType } from '../whatsapp-gateway-directory';
import {
  useWhatsAppGatewayDirectory,
  type WhatsAppDirectoryPageLoader,
} from '../use-whatsapp-gateway-directory';

const COMPACT_LIST_CLASS = 'max-h-52';

export function WhatsAppGatewayDirectoryPicker(props: {
  open: boolean;
  configured: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  debouncedSearch: string;
  disabled?: boolean;
  compact?: boolean;
  selectedId?: string | null;
  onSelect?: (item: WhatsAppGatewayChatItem) => void;
  loadPage?: WhatsAppDirectoryPageLoader;
  searchPlaceholder?: string;
  emptyMessage?: string;
}) {
  return (
    <div
      className={cn(
        'flex w-full min-w-0 flex-col gap-3',
        props.compact ? 'overflow-hidden' : 'min-h-0 flex-1',
      )}
    >
      <div className="relative shrink-0">
        <Input
          id="wa-directory-search"
          value={props.search}
          onChange={(event) => props.onSearchChange(event.target.value)}
          placeholder={props.searchPlaceholder ?? 'Search by name or ID…'}
          disabled={!props.configured || props.disabled}
          className="pr-10"
        />
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2"
          aria-hidden
        />
      </div>
      <WhatsAppGatewayDirectoryResults
        open={props.open}
        configured={props.configured}
        search={props.debouncedSearch}
        compact={props.compact}
        disabled={props.disabled}
        selectedId={props.selectedId}
        onSelect={props.onSelect}
        loadPage={props.loadPage}
        emptyMessage={props.emptyMessage}
      />
    </div>
  );
}

function WhatsAppGatewayDirectoryResults(props: {
  open: boolean;
  configured: boolean;
  search: string;
  compact?: boolean;
  disabled?: boolean;
  selectedId?: string | null;
  onSelect?: (item: WhatsAppGatewayChatItem) => void;
  loadPage?: WhatsAppDirectoryPageLoader;
  emptyMessage?: string;
}) {
  const { items, loading, loadingMore, hasMore, errorMessage, loadPage, sentinelRef } =
    useWhatsAppGatewayDirectory({
      open: props.open,
      configured: props.configured,
      search: props.search,
      loadPage: props.loadPage,
    });

  if (!props.configured) {
    return (
      <p className="text-muted-foreground text-sm">
        Connect WhatsApp Gateway first, then browse chats and groups.
      </p>
    );
  }

  return (
    <div className={cn('flex min-h-0 w-full min-w-0 flex-col gap-2', !props.compact && 'flex-1')}>
      {errorMessage ? <p className="text-destructive text-xs">{errorMessage}</p> : null}
      <div
        className={cn(
          'min-h-0 w-full min-w-0 overflow-x-hidden overflow-y-auto',
          props.compact ? COMPACT_LIST_CLASS : 'flex-1',
        )}
      >
        <WhatsAppGatewayDirectoryList
          items={items}
          loading={loading}
          disabled={props.disabled}
          selectedId={props.selectedId}
          onSelect={props.onSelect}
          emptyMessage={props.emptyMessage}
        />
      </div>
      {hasMore ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 self-start"
          disabled={loading || loadingMore || props.disabled}
          onClick={() => void loadPage(items.length, true)}
        >
          {loadingMore ? 'Loading…' : 'Load more'}
        </Button>
      ) : null}
      <div ref={sentinelRef} className="h-px w-full" aria-hidden />
    </div>
  );
}

function WhatsAppGatewayDirectoryList(props: {
  items: WhatsAppGatewayChatItem[];
  loading: boolean;
  disabled?: boolean;
  selectedId?: string | null;
  onSelect?: (item: WhatsAppGatewayChatItem) => void;
  emptyMessage?: string;
}) {
  if (props.loading && props.items.length === 0) {
    return <p className="text-muted-foreground text-sm">Loading…</p>;
  }
  if (props.items.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        {props.emptyMessage ?? 'No chats match this search.'}
      </p>
    );
  }

  return (
    <ul className="divide-border w-full min-w-0 divide-y">
      {props.items.map((item) => (
        <WhatsAppGatewayDirectoryRow
          key={item.id}
          item={item}
          disabled={props.disabled}
          selected={props.selectedId === item.id}
          onSelect={props.onSelect}
        />
      ))}
    </ul>
  );
}

function WhatsAppGatewayDirectoryRow(props: {
  item: WhatsAppGatewayChatItem;
  disabled?: boolean;
  selected?: boolean;
  onSelect?: (item: WhatsAppGatewayChatItem) => void;
}) {
  const type = resolveDirectoryChatType(props.item.id, props.item.type);
  const title = props.item.name.trim() || props.item.id;
  return (
    <li className="min-w-0">
      <div
        className={cn(
          'flex min-w-0 items-start gap-3 py-2.5 first:pt-0',
          props.selected && 'bg-muted/60 rounded-md px-2',
        )}
      >
        <WhatsAppDirectoryKindMark type={type} />
        {props.onSelect ? (
          <button
            type="button"
            disabled={props.disabled}
            aria-pressed={props.selected}
            className="min-w-0 flex-1 text-left disabled:opacity-60"
            onClick={() => props.onSelect?.(props.item)}
          >
            <WhatsAppDirectoryRowCopy title={title} type={type} id={props.item.id} />
          </button>
        ) : (
          <div className="min-w-0 flex-1">
            <WhatsAppDirectoryRowCopy title={title} type={type} id={props.item.id} />
          </div>
        )}
        {props.onSelect ? null : <WhatsAppDirectoryCopyButton title={title} id={props.item.id} />}
      </div>
    </li>
  );
}

function WhatsAppDirectoryRowCopy(props: {
  title: string;
  type: WhatsAppGatewayChatType;
  id: string;
}) {
  return (
    <>
      <div className="flex min-w-0 items-center gap-2">
        <p className="text-foreground truncate text-sm font-medium">{props.title}</p>
        <WhatsAppDirectoryKindBadge type={props.type} />
      </div>
      <p className="text-muted-foreground mt-0.5 truncate font-mono text-xs">{props.id}</p>
    </>
  );
}

function WhatsAppDirectoryCopyButton(props: { title: string; id: string }) {
  return (
    <Button
      type="button"
      size="icon-sm"
      variant="ghost"
      aria-label={`Copy ${props.title}`}
      className="text-muted-foreground shrink-0"
      onClick={() => {
        void navigator.clipboard.writeText(props.id).then(
          () => toast.success('Chat ID copied'),
          () => toast.error('Could not copy chat ID'),
        );
      }}
    >
      <Copy className="size-3.5" aria-hidden />
    </Button>
  );
}

function WhatsAppDirectoryKindMark({ type }: { type: WhatsAppGatewayChatType }) {
  const isGroup = type === 'group';
  const Icon = isGroup ? Users : User;
  return (
    <span
      className={
        isGroup
          ? 'bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-full'
          : 'bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full'
      }
      aria-hidden
    >
      <Icon className="size-4" />
    </span>
  );
}

function WhatsAppDirectoryKindBadge({ type }: { type: WhatsAppGatewayChatType }) {
  const isGroup = type === 'group';
  return (
    <Badge variant={isGroup ? 'secondary' : 'outline'} className="shrink-0">
      {isGroup ? 'Group' : 'Personal'}
    </Badge>
  );
}
