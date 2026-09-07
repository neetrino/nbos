'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type RefObject,
  type SetStateAction,
} from 'react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  whatsappGatewayApi,
  type WhatsAppGatewayChatItem,
  type WhatsAppGatewayChatsPage,
} from '@/lib/api/whatsapp';
import {
  directoryHasMorePage,
  WHATSAPP_GATEWAY_DIRECTORY_PAGE_SIZE,
} from './whatsapp-gateway-directory';

export type WhatsAppDirectoryPageLoader = (args: {
  limit: number;
  offset: number;
  search: string;
}) => Promise<WhatsAppGatewayChatsPage>;

export function useWhatsAppGatewayDirectory(props: {
  open: boolean;
  configured: boolean;
  search: string;
  loadPage?: WhatsAppDirectoryPageLoader;
}) {
  const [items, setItems] = useState<WhatsAppGatewayChatItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inflightRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const fetchPage = props.loadPage ?? loadGatewayChatsPage;
  const loadPage = useCallback(
    (offset: number, append: boolean) =>
      loadDirectoryPage({
        configured: props.configured,
        search: props.search,
        append,
        offset,
        fetchPage,
        inflightRef,
        setItems,
        setHasMore,
        setErrorMessage,
        setLoading,
        setLoadingMore,
      }),
    [fetchPage, props.configured, props.search],
  );

  useEffect(() => {
    if (!props.open) return;
    void loadPage(0, false);
  }, [props.open, loadPage]);

  useWhatsAppDirectoryAutoLoad({
    open: props.open,
    hasMore,
    loading,
    loadingMore,
    itemCount: items.length,
    sentinelRef,
    loadPage,
  });

  return { items, loading, loadingMore, hasMore, errorMessage, loadPage, sentinelRef };
}

function loadGatewayChatsPage(args: {
  limit: number;
  offset: number;
  search: string;
}): Promise<WhatsAppGatewayChatsPage> {
  return whatsappGatewayApi.listChats(args);
}

async function loadDirectoryPage(args: {
  configured: boolean;
  search: string;
  append: boolean;
  offset: number;
  fetchPage: WhatsAppDirectoryPageLoader;
  inflightRef: MutableRefObject<boolean>;
  setItems: Dispatch<SetStateAction<WhatsAppGatewayChatItem[]>>;
  setHasMore: Dispatch<SetStateAction<boolean>>;
  setErrorMessage: Dispatch<SetStateAction<string | null>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setLoadingMore: Dispatch<SetStateAction<boolean>>;
}): Promise<void> {
  if (!args.configured) {
    args.setItems(() => []);
    args.setHasMore(false);
    args.setErrorMessage(null);
    return;
  }
  if (args.inflightRef.current) return;
  args.inflightRef.current = true;
  if (args.append) args.setLoadingMore(true);
  else args.setLoading(true);
  try {
    const page = await args.fetchPage({
      limit: WHATSAPP_GATEWAY_DIRECTORY_PAGE_SIZE,
      offset: args.offset,
      search: args.search,
    });
    args.setItems((previous) => (args.append ? [...previous, ...page.items] : page.items));
    args.setHasMore(directoryHasMorePage(page.items.length, page.pagination.limit));
    args.setErrorMessage(null);
  } catch (error) {
    const message = getApiErrorMessage(error, 'Could not load WhatsApp chats.');
    args.setErrorMessage(message);
    if (!args.append) args.setItems(() => []);
    toast.error(message);
  } finally {
    args.inflightRef.current = false;
    args.setLoading(false);
    args.setLoadingMore(false);
  }
}

function useWhatsAppDirectoryAutoLoad({
  open,
  hasMore,
  loading,
  loadingMore,
  itemCount,
  sentinelRef,
  loadPage,
}: {
  open: boolean;
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  itemCount: number;
  sentinelRef: RefObject<HTMLDivElement | null>;
  loadPage: (offset: number, append: boolean) => Promise<void>;
}) {
  useEffect(() => {
    if (!open || !hasMore || loading || loadingMore) return;
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadPage(itemCount, true);
        }
      },
      { rootMargin: '120px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [open, hasMore, loading, loadingMore, itemCount, sentinelRef, loadPage]);
}
