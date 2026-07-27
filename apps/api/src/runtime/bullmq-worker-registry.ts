import { Injectable } from '@nestjs/common';

/** Tracks BullMQ workers that actually started (for role assertions + readiness). */
@Injectable()
export class BullmqWorkerRegistry {
  private readonly started = new Set<string>();
  private shutdownStarted = false;
  private startupComplete = false;

  register(queueName: string): void {
    this.started.add(queueName);
  }

  list(): string[] {
    return [...this.started].sort();
  }

  markStartupComplete(): void {
    this.startupComplete = true;
  }

  isStartupComplete(): boolean {
    return this.startupComplete;
  }

  beginShutdown(): void {
    this.shutdownStarted = true;
  }

  isShuttingDown(): boolean {
    return this.shutdownStarted;
  }

  assertApiHasNoWorkers(): void {
    if (this.started.size > 0) {
      throw new Error(
        `PROCESS_ROLE=api must not start BullMQ workers; started: ${this.list().join(', ')}`,
      );
    }
  }

  assertWorkerHasConsumers(expected: readonly string[]): void {
    for (const name of expected) {
      if (!this.started.has(name)) {
        throw new Error(
          `Worker process missing BullMQ consumer for queue "${name}". Registered: ${this.list().join(', ') || '(none)'}`,
        );
      }
    }
  }
}
