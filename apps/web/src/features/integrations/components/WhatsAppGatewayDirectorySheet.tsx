'use client';

import { useCallback, useEffect, useState } from 'react';
import { Copy, Search, User, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/components/shared';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  whatsappGatewayApi,
  type WhatsAppGatewayChatItem,
  type WhatsAppGatewayChatType,
} from '@/lib/api/whatsapp';
import {
  directoryHasMorePage,
  resolveDirectoryChatType,
  WHATSAPP_GATEWAY_DIRECTORY_PAGE_SIZE,
} from '../whatsapp-gateway-directory';

interface WhatsAppGatewayDirectorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  configured: boolean;
}

export function WhatsAppGatewayDirectorySheet({
  open,
  onOpenChange,
  configured,
}: WhatsAppGatewayDirectorySheetProps) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS).trim();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-x-hidden sm:max-w-md">
        <div className="flex h-full min-h-0 min-w-0 flex-col">
          <SheetHeader className="border-border shrink-0 border-b px-5 py-4 pr-14">
            <SheetTitle>WhatsApp chats</SheetTitle>
            <SheetDescription>
              Groups and personal chats in one inbox-style list. Search is sent to the Gateway on
              every request.
            </SheetDescription>
          </SheetHeader>
          <WhatsAppGatewayDirectoryBody
            open={open}
            configured={configured}
            search={search}
            onSearchChange={setSearch}
            debouncedSearch={debouncedSearch}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function WhatsAppGatewayDirectoryBody(props: {
  open: boolean;
  configured: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  debouncedSearch: string;
}) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 px-5 py-4">
      <div className="relative shrink-0">
        <Input
          id="wa-directory-search"
          value={props.search}
          onChange={(event) => props.onSearchChange(event.target.value)}
          placeholder="Search by name or ID…"
          disabled={!props.configured}
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
      />
    </div>
  );
}

function WhatsAppGatewayDirectoryResults(props: {
  open: boolean;
  configured: boolean;
  search: string;
}) {
  const [items, setItems] = useState<WhatsAppGatewayChatItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadPage = useCallback(
    async (offset: number, append: boolean) => {
      if (!props.configured) {
        setItems([]);
        setHasMore(false);
        setErrorMessage(null);
        return;
      }
      if (append) setLoadingMore(true);
      else setLoading(true);
      try {
        const page = await whatsappGatewayApi.listChats({
          limit: WHATSAPP_GATEWAY_DIRECTORY_PAGE_SIZE,
          offset,
          search: props.search,
        });
        setItems((previous) => (append ? [...previous, ...page.items] : page.items));
        setHasMore(directoryHasMorePage(page.items.length, page.pagination.limit));
        setErrorMessage(null);
      } catch (error) {
        const message = getApiErrorMessage(error, 'Could not load WhatsApp chats.');
        setErrorMessage(message);
        if (!append) setItems([]);
        toast.error(message);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [props.configured, props.search],
  );

  useEffect(() => {
    if (!props.open) return;
    void loadPage(0, false);
  }, [props.open, loadPage]);

  if (!props.configured) {
    return (
      <p className="text-muted-foreground text-sm">
        Connect WhatsApp Gateway first, then browse chats and groups.
      </p>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {errorMessage ? <p className="text-destructive text-xs">{errorMessage}</p> : null}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <WhatsAppGatewayDirectoryList items={items} loading={loading} />
      </div>
      {hasMore ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 self-start"
          disabled={loading || loadingMore}
          onClick={() => void loadPage(items.length, true)}
        >
          {loadingMore ? 'Loading…' : 'Load more'}
        </Button>
      ) : null}
    </div>
  );
}

function WhatsAppGatewayDirectoryList(props: {
  items: WhatsAppGatewayChatItem[];
  loading: boolean;
}) {
  if (props.loading && props.items.length === 0) {
    return <p className="text-muted-foreground text-sm">Loading…</p>;
  }
  if (props.items.length === 0) {
    return <p className="text-muted-foreground text-sm">No chats match this search.</p>;
  }

  return (
    <ul className="divide-border divide-y">
      {props.items.map((item) => (
        <WhatsAppGatewayDirectoryRow key={item.id} item={item} />
      ))}
    </ul>
  );
}

function WhatsAppGatewayDirectoryRow({ item }: { item: WhatsAppGatewayChatItem }) {
  const type = resolveDirectoryChatType(item.id, item.type);
  const title = item.name.trim() || item.id;
  return (
    <li className="flex items-start gap-3 py-2.5 first:pt-0">
      <WhatsAppDirectoryKindMark type={type} />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className="text-foreground truncate text-sm font-medium">{title}</p>
          <WhatsAppDirectoryKindBadge type={type} />
        </div>
        <p className="text-muted-foreground mt-0.5 truncate font-mono text-xs">{item.id}</p>
      </div>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        aria-label={`Copy ${title}`}
        className="text-muted-foreground shrink-0"
        onClick={() => {
          void navigator.clipboard.writeText(item.id).then(
            () => toast.success('Chat ID copied'),
            () => toast.error('Could not copy chat ID'),
          );
        }}
      >
        <Copy className="size-3.5" aria-hidden />
      </Button>
    </li>
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
