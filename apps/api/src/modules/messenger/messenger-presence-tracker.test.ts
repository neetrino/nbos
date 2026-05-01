import { describe, it, expect, beforeEach } from 'vitest';
import { MessengerPresenceTracker } from './messenger-presence-tracker';

describe('MessengerPresenceTracker', () => {
  let tracker: MessengerPresenceTracker;

  beforeEach(() => {
    tracker = new MessengerPresenceTracker();
  });

  it('marks first increment as becameOnline and second as not', () => {
    expect(tracker.increment('a')).toEqual({ becameOnline: true });
    expect(tracker.increment('a')).toEqual({ becameOnline: false });
    expect(tracker.snapshotEmployeeIds()).toEqual(['a']);
  });

  it('marks last decrement as becameOffline', () => {
    tracker.increment('a');
    tracker.increment('a');
    expect(tracker.decrement('a')).toEqual({ becameOffline: false });
    expect(tracker.decrement('a')).toEqual({ becameOffline: true });
    expect(tracker.snapshotEmployeeIds()).toEqual([]);
  });

  it('decrement for unknown id is idempotent', () => {
    expect(tracker.decrement('ghost')).toEqual({ becameOffline: false });
  });
});
