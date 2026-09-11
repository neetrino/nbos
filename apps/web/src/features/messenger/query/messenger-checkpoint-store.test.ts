import { describe, expect, it } from 'vitest';
import {
  parseMessengerHttpCheckpoint,
  readMessengerHttpCheckpoint,
  restoreMessengerHttpCheckpoint,
  writeMessengerHttpCheckpoint,
} from './messenger-checkpoint-store';
import { seedInternalMessengerBootstrap } from './seed-messenger-bootstrap';
import { QueryClient } from '@tanstack/react-query';
import { messengerTestCheckpoint, messengerTestFullRecovery } from './messenger-test-checkpoint';

describe('Messenger HTTP checkpoint parsing', () => {
  it('seeds Phase-3 or FULL bootstrap data without storing a checkpoint', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    seedInternalMessengerBootstrap(queryClient, {
      summaries: { items: [], mentionsAvailable: true },
      collections: [],
    });
    expect(readMessengerHttpCheckpoint(queryClient, 'INTERNAL')).toBeNull();
    seedInternalMessengerBootstrap(queryClient, {
      summaries: { items: [], mentionsAvailable: true },
      collections: [],
      ...messengerTestFullRecovery(),
    });
    expect(readMessengerHttpCheckpoint(queryClient, 'INTERNAL')).toBeNull();
  });

  it('rejects a DELTA bootstrap with a malformed checkpoint instead of seeding recovery', () => {
    expect(
      parseMessengerHttpCheckpoint({ checkpoint: '-1', authorizationEpoch: 'aa'.repeat(16) }),
    ).toBeNull();
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    expect(() =>
      seedInternalMessengerBootstrap(queryClient, {
        summaries: { items: [], mentionsAvailable: true },
        collections: [],
        recoveryMode: 'DELTA',
        checkpoint: 'nope',
        authorizationEpoch: messengerTestCheckpoint().authorizationEpoch,
      }),
    ).toThrow(/checkpoint missing/);
    expect(readMessengerHttpCheckpoint(queryClient, 'INTERNAL')).toBeNull();
  });

  it('stores the checkpoint only after valid DELTA bootstrap payload parsing', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    seedInternalMessengerBootstrap(queryClient, {
      summaries: { items: [], mentionsAvailable: true },
      collections: [],
      ...messengerTestCheckpoint('6'),
    });
    expect(readMessengerHttpCheckpoint(queryClient, 'INTERNAL')).toEqual({
      checkpoint: '6',
      authorizationEpoch: messengerTestCheckpoint().authorizationEpoch,
    });
  });

  it('restores a checkpoint only when the session does not already have one', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const first = {
      checkpoint: '4',
      authorizationEpoch: messengerTestCheckpoint().authorizationEpoch,
    };
    const second = {
      checkpoint: '9',
      authorizationEpoch: messengerTestCheckpoint().authorizationEpoch,
    };
    expect(restoreMessengerHttpCheckpoint(queryClient, 'INTERNAL', first)).toBe(true);
    expect(restoreMessengerHttpCheckpoint(queryClient, 'INTERNAL', second)).toBe(false);
    expect(readMessengerHttpCheckpoint(queryClient, 'INTERNAL')).toEqual(first);
    writeMessengerHttpCheckpoint(queryClient, 'INTERNAL', second);
    expect(readMessengerHttpCheckpoint(queryClient, 'INTERNAL')).toEqual(second);
  });
});
