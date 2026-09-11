import { act, createElement, StrictMode, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useInternalMessengerQueries } from '@/features/messenger-internal/use-internal-messenger-queries';
import { useClientMessengerQueries } from '@/features/messenger-client/use-client-messenger-queries';

export type HookRequestFrame = {
  itemIds: string[];
  listPending: boolean;
  listError: string | null;
};

export function createMessengerTestQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

export async function mountInternalMessengerQueries(
  queryClient: QueryClient,
  frames: HookRequestFrame[],
  options?: { strict?: boolean },
): Promise<{ root: Root; container: HTMLDivElement }> {
  return mountHookTree(
    queryClient,
    createElement(InternalProbe, { frames }),
    options?.strict === true,
  );
}

export async function mountClientMessengerQueries(
  queryClient: QueryClient,
  frames: HookRequestFrame[],
  options?: { strict?: boolean },
): Promise<{ root: Root; container: HTMLDivElement }> {
  return mountHookTree(
    queryClient,
    createElement(ClientProbe, { frames }),
    options?.strict === true,
  );
}

export async function unmountHookTree(mounted: {
  root: Root;
  container: HTMLDivElement;
}): Promise<void> {
  await act(async () => {
    mounted.root.unmount();
  });
  mounted.container.remove();
}

export async function flushUntil(predicate: () => boolean, attempts = 25): Promise<void> {
  for (let i = 0; i < attempts; i += 1) {
    if (predicate()) return;
    await act(async () => {
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }
  throw new Error('Messenger hook graph did not settle');
}

async function mountHookTree(
  queryClient: QueryClient,
  probe: ReactNode,
  strict: boolean,
): Promise<{ root: Root; container: HTMLDivElement }> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const tree = createElement(QueryClientProvider, { client: queryClient }, probe);
  await act(async () => {
    root.render(strict ? createElement(StrictMode, null, tree) : tree);
  });
  return { root, container };
}

function InternalProbe(props: { frames: HookRequestFrame[] }) {
  const result = useInternalMessengerQueries({
    section: 'all',
    search: '',
    filter: 'all',
    activeId: null,
    activeCollectionId: null,
    enabled: true,
  });
  props.frames.push(toFrame(result));
  return createElement('div', { 'data-messenger-probe': 'internal' });
}

function ClientProbe(props: { frames: HookRequestFrame[] }) {
  const result = useClientMessengerQueries({
    section: 'inbox',
    search: '',
    filter: 'all',
    provider: '',
    activeId: null,
    activeCollectionId: null,
    enabled: true,
  });
  props.frames.push(toFrame(result));
  return createElement('div', { 'data-messenger-probe': 'client' });
}

function toFrame(result: {
  items: Array<{ id: string }>;
  listPending: boolean;
  listError: unknown;
}): HookRequestFrame {
  return {
    itemIds: result.items.map((item) => item.id),
    listPending: result.listPending,
    listError: result.listError instanceof Error ? result.listError.message : null,
  };
}
