import { Injectable } from '@nestjs/common';

/** Tracks cron jobs actually registered in this process (for role assertions). */
@Injectable()
export class ScheduledJobRegistry {
  private readonly jobs = new Set<string>();
  private shutdownStarted = false;
  private startupComplete = false;

  register(jobName: string): void {
    this.jobs.add(jobName);
  }

  list(): string[] {
    return [...this.jobs].sort();
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

  assertNoScheduledJobs(role: string): void {
    if (this.jobs.size > 0) {
      throw new Error(
        `PROCESS_ROLE=${role} must not register cron jobs; registered: ${this.list().join(', ')}`,
      );
    }
  }

  assertHasScheduledJobsWhenEnabled(schedulerEnabled: boolean): void {
    if (!schedulerEnabled) return;
    if (this.jobs.size === 0) {
      throw new Error(
        'PROCESS_ROLE=scheduler with SCHEDULER_ENABLED=true requires at least one registered scheduled job',
      );
    }
  }
}
