import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient, VideoMeetingRecordingAssetStatus } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { VideoMeetingsFeatureService } from './video-meetings-feature.service';
import {
  VIDEO_MEETING_RECORDING_RECONCILE_BATCH_SIZE,
  VIDEO_MEETING_RECORDING_RECONCILE_INTERVAL_MS,
} from './video-meetings-recording.constants';
import { VideoMeetingsRecordingFinalizeService } from './video-meetings-recording-finalize.service';

/**
 * Retries Drive verify/finalize when egress webhooks are missing or replayed.
 * Idempotent — same asset id never creates a second FileAsset.
 */
@Injectable()
export class VideoMeetingsRecordingReconcileService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(VideoMeetingsRecordingReconcileService.name);
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly feature: VideoMeetingsFeatureService,
    private readonly finalize: VideoMeetingsRecordingFinalizeService,
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(() => {
      void this.tick();
    }, VIDEO_MEETING_RECORDING_RECONCILE_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private async tick(): Promise<void> {
    if (!this.feature.isEnabled()) return;
    try {
      await this.reconcilePending();
    } catch (error) {
      this.logger.warn(`Recording reconcile tick failed: ${String(error)}`);
    }
  }

  async reconcilePending(
    limit = VIDEO_MEETING_RECORDING_RECONCILE_BATCH_SIZE,
  ): Promise<{ attempted: number; ready: number }> {
    const assets = await this.prisma.videoMeetingRecordingAsset.findMany({
      where: {
        status: VideoMeetingRecordingAssetStatus.PENDING,
        objectKey: { not: null },
        recording: {
          status: { in: ['FINALIZING', 'PARTIAL', 'FAILED'] },
        },
      },
      take: limit,
      orderBy: { updatedAt: 'asc' },
      select: { id: true, recordingId: true },
    });

    let ready = 0;
    const touchedGroups = new Set<string>();
    for (const asset of assets) {
      const status = await this.finalize.finalizeAsset(asset.id);
      if (status === VideoMeetingRecordingAssetStatus.READY) ready += 1;
      touchedGroups.add(asset.recordingId);
    }
    for (const recordingId of touchedGroups) {
      await this.finalize.refreshGroupStatus(recordingId);
    }
    if (assets.length > 0) {
      this.logger.log(`Reconciled ${assets.length} recording assets (${ready} READY)`);
    }
    return { attempted: assets.length, ready };
  }
}
