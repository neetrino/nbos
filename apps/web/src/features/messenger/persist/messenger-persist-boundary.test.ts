/** @vitest-environment jsdom */

import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { messengerQueryKeys } from '../query/messenger-query-keys';
import {
  applyMessengerPersistSessionIdentity,
  shouldWithholdMessengerPersistChildren,
} from './messenger-persist-boundary';
import { MessengerPersistProvider } from './MessengerPersistProvider';
import {
  getMessengerPersistQueryEnabled,
  readMessengerPersistReadyState,
  resetMessengerPersistReadyForTests,
  settleMessengerPersistReadyForTests,
} from './messenger-persist-ready';
import {
  bindMessengerPersistQueryClient,
  resetMessengerPersistSessionForTests,
} from './messenger-persist-session';
import { persistTestInternalPage } from './messenger-persist-test-dto';
import { setMessengerPersistBackendForTests } from './messenger-persist-controller';
import { useMessengerPersistQueriesEnabled } from './use-messenger-persist-queries-enabled';

const IDENTITY_A = 'employee-user-aaaa';
const IDENTITY_B = 'employee-user-bbbb';
const IDENTITY_C = 'employee-user-cccc';

let session: {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  data: { user: { id: string } } | null;
} = {
  status: 'authenticated',
  data: { user: { id: IDENTITY_A } },
};

vi.mock('next-auth/react', () => ({
  useSession: () => session,
}));

type ProbeFrame = {
  sessionId: string | null;
  itemId: string | null;
  enabled: boolean;
};

function createClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function seedIdentityA(queryClient: QueryClient): void {
  queryClient.setQueryData(
    messengerQueryKeys.internalSummaries({ source: 'all-dataset' }),
    persistTestInternalPage('from-A'),
  );
  bindMessengerPersistQueryClient(queryClient);
  settleMessengerPersistReadyForTests(IDENTITY_A);
}

describe('Messenger persist identity boundary', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    resetMessengerPersistSessionForTests();
    resetMessengerPersistReadyForTests();
    setMessengerPersistBackendForTests(null);
    session = { status: 'authenticated', data: { user: { id: IDENTITY_A } } };
  });

  it('withholds children on A→B and logout before layout work, not on same-identity loading', () => {
    expect(
      shouldWithholdMessengerPersistChildren({
        status: 'authenticated',
        liveIdentity: IDENTITY_B,
        preparedIdentityId: IDENTITY_A,
      }),
    ).toBe(true);
    expect(
      shouldWithholdMessengerPersistChildren({
        status: 'unauthenticated',
        liveIdentity: null,
        preparedIdentityId: IDENTITY_A,
      }),
    ).toBe(true);
    expect(
      shouldWithholdMessengerPersistChildren({
        status: 'loading',
        liveIdentity: IDENTITY_A,
        preparedIdentityId: IDENTITY_A,
      }),
    ).toBe(false);
    expect(
      shouldWithholdMessengerPersistChildren({
        status: 'authenticated',
        liveIdentity: IDENTITY_A,
        preparedIdentityId: null,
      }),
    ).toBe(false);
  });

  it('purges A cache in the layout-phase apply before B can read it', () => {
    const queryClient = createClient();
    seedIdentityA(queryClient);
    expect(
      shouldWithholdMessengerPersistChildren({
        status: 'authenticated',
        liveIdentity: IDENTITY_B,
        preparedIdentityId: readMessengerPersistReadyState().preparedIdentityId,
      }),
    ).toBe(true);
    expect(
      queryClient.getQueryData(messengerQueryKeys.internalSummaries({ source: 'all-dataset' })),
    ).toEqual(persistTestInternalPage('from-A'));
    applyMessengerPersistSessionIdentity(queryClient, IDENTITY_B);
    expect(
      queryClient.getQueryData(messengerQueryKeys.internalSummaries({ source: 'all-dataset' })),
    ).toBeUndefined();
    expect(getMessengerPersistQueryEnabled()).toBe(false);
    expect(readMessengerPersistReadyState().preparedIdentityId).toBe(IDENTITY_B);
  });

  it('does not let B render A QueryClient data or start a query before B settles', async () => {
    setMessengerPersistBackendForTests({
      read: () => new Promise(() => undefined),
      write: async () => undefined,
      compareAndWrite: async () => false,
      delete: async () => undefined,
      clear: async () => undefined,
    });
    const queryClient = createClient();
    seedIdentityA(queryClient);
    const queryFn = vi.fn(async () => persistTestInternalPage('from-B'));
    const frames: ProbeFrame[] = [];
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    await renderBoundary(root, queryClient, queryFn, frames);
    expect(frames.some((frame) => frame.itemId === 'from-A')).toBe(true);
    const marked = frames.length;
    queryFn.mockClear();
    session = { status: 'authenticated', data: { user: { id: IDENTITY_B } } };
    await renderBoundary(root, queryClient, queryFn, frames);
    const afterSwitch = frames.slice(marked);
    expect(
      afterSwitch.some((frame) => frame.sessionId === IDENTITY_B && frame.itemId === 'from-A'),
    ).toBe(false);
    expect(queryFn).not.toHaveBeenCalled();
    expect(getMessengerPersistQueryEnabled()).toBe(false);
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('ignores late A hydration after a rapid A→B→C apply', () => {
    const queryClient = createClient();
    seedIdentityA(queryClient);
    applyMessengerPersistSessionIdentity(queryClient, IDENTITY_B);
    const generationB = readMessengerPersistReadyState();
    applyMessengerPersistSessionIdentity(queryClient, IDENTITY_C);
    expect(readMessengerPersistReadyState().preparedIdentityId).toBe(IDENTITY_C);
    expect(generationB.preparedIdentityId).not.toBe(IDENTITY_C);
    expect(getMessengerPersistQueryEnabled()).toBe(false);
    expect(
      queryClient.getQueryData(messengerQueryKeys.internalSummaries({ source: 'all-dataset' })),
    ).toBeUndefined();
  });
});

async function renderBoundary(
  root: Root,
  queryClient: QueryClient,
  queryFn: () => Promise<unknown>,
  frames: ProbeFrame[],
): Promise<void> {
  await act(async () => {
    root.render(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(
          MessengerPersistProvider,
          null,
          createElement(BoundaryProbe, { queryFn, frames }),
        ),
      ),
    );
  });
}

function BoundaryProbe(props: { queryFn: () => Promise<unknown>; frames: ProbeFrame[] }) {
  const queryClient = useQueryClient();
  const persistReady = useMessengerPersistQueriesEnabled();
  const data = queryClient.getQueryData(
    messengerQueryKeys.internalSummaries({ source: 'all-dataset' }),
  ) as { items?: Array<{ id: string }> } | undefined;
  useQuery({
    queryKey: ['messenger', 'boundary-probe'],
    queryFn: props.queryFn,
    enabled: persistReady,
  });
  props.frames.push({
    sessionId: session.data?.user.id ?? null,
    itemId: data?.items?.[0]?.id ?? null,
    enabled: persistReady,
  });
  return createElement('div', { 'data-probe': '1' });
}
