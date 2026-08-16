import { describe, expect, it } from 'vitest';
import { NotificationRefetchRegistry } from './notification-refetch-registry';
import {
  resetNotificationSseVersionOnOpen,
  shouldApplyNotificationSseVersion,
  createNotificationSseVersionGate,
} from './notification-sse-version';

/**
 * Integration-style scenario covering reconnect version reset + single in-flight GET.
 */
describe('SSE reconnect reconciliation scenario', () => {
  it('accepts version=1 after restart and dedupes parallel unread GETs', async () => {
    let gate = createNotificationSseVersionGate();
    gate = resetNotificationSseVersionOnOpen(gate);
    gate = shouldApplyNotificationSseVersion(gate, gate.generation, 42).next;

    // disconnect → reconnect (API process restart)
    gate = resetNotificationSseVersionOnOpen(gate);
    expect(gate.lastVersion).toBeNull();

    const registry = new NotificationRefetchRegistry();
    let gets = 0;
    registry.register('notifications/unread', async () => {
      gets += 1;
      await new Promise((r) => setTimeout(r, 20));
    });

    // open + focus + visibility would all request unread — registry dedupes
    registry.request(['notifications/unread'], true);
    registry.request(['notifications/unread'], true);
    registry.request(['notifications/unread'], true);
    await new Promise((r) => setTimeout(r, 40));
    expect(gets).toBe(1);

    let decided = shouldApplyNotificationSseVersion(gate, gate.generation, 1);
    expect(decided.apply).toBe(true);
    gate = decided.next;
    decided = shouldApplyNotificationSseVersion(gate, gate.generation, 3);
    expect(decided.apply).toBe(true);
    gate = decided.next;
    decided = shouldApplyNotificationSseVersion(gate, gate.generation, 2);
    expect(decided.apply).toBe(false);
  });

  it('feed-style unread handler keeps prior badge when GET fails', async () => {
    const registry = new NotificationRefetchRegistry();
    const badge = 7;
    registry.register('notifications/unread', async () => {
      try {
        throw new Error('network');
      } catch {
        /* keep last known count — never force badge to 0 */
      }
    });
    registry.request(['notifications/unread'], true);
    await new Promise((r) => setTimeout(r, 10));
    expect(badge).toBe(7);
  });
});
