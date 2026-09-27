import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { VideoMeetingsDurationGuardService } from './video-meetings-duration-guard.service';
import { VideoMeetingsFeatureService } from './video-meetings-feature.service';

/** Backup for clients that disappeared. The office network can die; this tick still ends the room. */
const DURATION_GUARD_TICK_MS = 15_000;

@Injectable()
export class VideoMeetingsDurationGuardCron implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(VideoMeetingsDurationGuardCron.name);
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor(
    private readonly feature: VideoMeetingsFeatureService,
    private readonly guard: VideoMeetingsDurationGuardService,
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(() => {
      void this.tick();
    }, DURATION_GUARD_TICK_MS);
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private async tick(): Promise<void> {
    if (!this.feature.isEnabled() || this.running) return;
    this.running = true;
    try {
      const ended = await this.guard.sweepDue();
      if (ended > 0) this.logger.log(`Duration guard ended ${ended} meeting(s)`);
    } catch (error) {
      this.logger.warn(`Duration guard tick failed: ${String(error)}`);
    } finally {
      this.running = false;
    }
  }
}
