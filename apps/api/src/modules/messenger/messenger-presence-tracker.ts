/**
 * Reference-counts messenger WebSocket connections per employee id
 * (multiple browser tabs → multiple sockets, one logical "online").
 */
export class MessengerPresenceTracker {
  private readonly counts = new Map<string, number>();

  increment(employeeId: string): { becameOnline: boolean } {
    const n = (this.counts.get(employeeId) ?? 0) + 1;
    this.counts.set(employeeId, n);
    return { becameOnline: n === 1 };
  }

  decrement(employeeId: string): { becameOffline: boolean } {
    const n = this.counts.get(employeeId) ?? 0;
    if (n <= 0) return { becameOffline: false };
    if (n === 1) {
      this.counts.delete(employeeId);
      return { becameOffline: true };
    }
    this.counts.set(employeeId, n - 1);
    return { becameOffline: false };
  }

  snapshotEmployeeIds(): string[] {
    return [...this.counts.keys()];
  }
}
