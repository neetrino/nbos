import { describe, expect, it } from 'vitest';
import {
  createNotificationSseVersionGate,
  resetNotificationSseVersionOnOpen,
  shouldApplyNotificationSseVersion,
} from './notification-sse-version';

describe('notification SSE version gate', () => {
  it('resets lastVersion on reconnect so a lower version is accepted', () => {
    let gate = createNotificationSseVersionGate();
    gate = resetNotificationSseVersionOnOpen(gate);
    let result = shouldApplyNotificationSseVersion(gate, gate.generation, 42);
    expect(result.apply).toBe(true);
    gate = result.next;
    expect(gate.lastVersion).toBe(42);

    // API restart → new SSE connection, process-local version restarts at 1
    gate = resetNotificationSseVersionOnOpen(gate);
    expect(gate.lastVersion).toBeNull();
    expect(gate.generation).toBe(2);

    result = shouldApplyNotificationSseVersion(gate, gate.generation, 1);
    expect(result.apply).toBe(true);
    gate = result.next;

    result = shouldApplyNotificationSseVersion(gate, gate.generation, 3);
    expect(result.apply).toBe(true);
    gate = result.next;

    result = shouldApplyNotificationSseVersion(gate, gate.generation, 2);
    expect(result.apply).toBe(false);
    expect(gate.lastVersion).toBe(3);
  });

  it('ignores events tagged with a previous connection generation', () => {
    let gate = createNotificationSseVersionGate();
    gate = resetNotificationSseVersionOnOpen(gate);
    const oldGeneration = gate.generation;
    shouldApplyNotificationSseVersion(gate, oldGeneration, 5);

    gate = resetNotificationSseVersionOnOpen(gate);
    const stale = shouldApplyNotificationSseVersion(gate, oldGeneration, 99);
    expect(stale.apply).toBe(false);

    const fresh = shouldApplyNotificationSseVersion(gate, gate.generation, 1);
    expect(fresh.apply).toBe(true);
  });

  it('ignores equal version', () => {
    let gate = createNotificationSseVersionGate();
    gate = resetNotificationSseVersionOnOpen(gate);
    const first = shouldApplyNotificationSseVersion(gate, gate.generation, 5);
    expect(first.apply).toBe(true);
    const second = shouldApplyNotificationSseVersion(first.next, gate.generation, 5);
    expect(second.apply).toBe(false);
  });
});
