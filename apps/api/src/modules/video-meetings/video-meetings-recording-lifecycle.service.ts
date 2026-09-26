import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import {
  PrismaClient,
  VideoMeetingRecordingAssetKind,
  VideoMeetingRecordingAssetStatus,
  VideoMeetingRecordingStatus,
  type Prisma,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { VideoMeetingsConsentService } from './video-meetings-consent.service';
import { VIDEO_MEETINGS_EGRESS_CLIENT_TOKEN } from './video-meetings-recording.constants';
import { buildParticipantAudioObjectKey } from './video-meetings-recording-keys';
import { deriveRecordingGroupStatus } from './video-meetings-recording-status';
import type { VideoMeetingsEgressClient } from './video-meetings-egress.types';
import { VideoMeetingsRecordingFinalizeService } from './video-meetings-recording-finalize.service';
import {
  serializeRecordingGroup,
  type VideoMeetingRecordingGroupDto,
} from './video-meetings-recording.serializer';

type RecordingWithAssets = Prisma.VideoMeetingRecordingGetPayload<{
  include: { assets: true };
}>;

/** Late-join segments, consent withdrawal, egress-ended → Drive finalize. */
@Injectable()
export class VideoMeetingsRecordingLifecycleService {
  private readonly logger = new Logger(VideoMeetingsRecordingLifecycleService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly consent: VideoMeetingsConsentService,
    private readonly finalize: VideoMeetingsRecordingFinalizeService,
    @Optional()
    @Inject(VIDEO_MEETINGS_EGRESS_CLIENT_TOKEN)
    private readonly egress: VideoMeetingsEgressClient | null,
  ) {}

  async startAudioSegmentForTrack(input: {
    meetingId: string;
    participantId: string;
    trackId: string;
    roomName: string;
  }): Promise<void> {
    if (!this.egress?.isConfigured()) return;
    const latest = await this.consent.getLatestForParticipant(input.participantId);
    if (!this.consent.isGranted(latest?.decision)) {
      this.logger.log(`Skipping audio egress for ${input.participantId}: consent not GRANTED`);
      return;
    }
    const recording = await this.findActiveRecording(input.meetingId);
    if (!recording || recording.status !== VideoMeetingRecordingStatus.RECORDING) return;

    const existing = recording.assets.find((a) => a.livekitTrackId === input.trackId && a.egressId);
    if (existing) return;

    const objectKey = buildParticipantAudioObjectKey(
      input.meetingId,
      recording.id,
      input.participantId,
    );
    const asset = await this.prisma.videoMeetingRecordingAsset.create({
      data: {
        recordingId: recording.id,
        kind: VideoMeetingRecordingAssetKind.PARTICIPANT_AUDIO,
        status: VideoMeetingRecordingAssetStatus.PENDING,
        participantId: input.participantId,
        livekitTrackId: input.trackId,
        objectKey,
        rangeStartsAt: new Date(),
      },
    });
    try {
      const started = await this.egress.startTrackAudio(input.roomName, input.trackId, objectKey);
      await this.prisma.videoMeetingRecordingAsset.update({
        where: { id: asset.id },
        data: { egressId: started.egressId },
      });
    } catch (error) {
      this.logger.warn(`Late-join audio egress failed: ${String(error)}`);
      await this.prisma.videoMeetingRecordingAsset.update({
        where: { id: asset.id },
        data: { status: VideoMeetingRecordingAssetStatus.FAILED, rangeEndsAt: new Date() },
      });
    }
  }

  /**
   * Consent withdrawal (REVOKED/DECLINED) while RECORDING stops the whole group
   * (ADR-VM-003 step 6): room-composite + all track egresses, then finalize.
   * Host restart remains a new recording group.
   */
  async stopCaptureOnConsentWithdrawal(meetingId: string): Promise<void> {
    const recording = await this.findActiveRecording(meetingId);
    if (!recording || recording.status !== VideoMeetingRecordingStatus.RECORDING) {
      return;
    }
    await this.finalizeRecording(recording.id);
  }

  async closeSegmentForTrack(egressId: string | null, trackId: string): Promise<void> {
    const asset = await this.prisma.videoMeetingRecordingAsset.findFirst({
      where: egressId
        ? { egressId }
        : { livekitTrackId: trackId, status: VideoMeetingRecordingAssetStatus.PENDING },
      orderBy: { createdAt: 'desc' },
    });
    if (!asset) return;
    if (asset.egressId && this.egress?.isConfigured()) {
      await this.egress.stopEgress(asset.egressId);
    }
    await this.prisma.videoMeetingRecordingAsset.update({
      where: { id: asset.id },
      data: { rangeEndsAt: new Date() },
    });
  }

  async applyEgressEnded(egressId: string): Promise<void> {
    const asset = await this.prisma.videoMeetingRecordingAsset.findFirst({ where: { egressId } });
    if (!asset) return;
    if (
      asset.status === VideoMeetingRecordingAssetStatus.READY ||
      asset.status === VideoMeetingRecordingAssetStatus.FAILED ||
      asset.status === VideoMeetingRecordingAssetStatus.MISSING
    ) {
      return;
    }
    if (!asset.objectKey) {
      await this.prisma.videoMeetingRecordingAsset.update({
        where: { id: asset.id },
        data: { status: VideoMeetingRecordingAssetStatus.FAILED, rangeEndsAt: new Date() },
      });
      return;
    }
    await this.finalize.finalizeAsset(asset.id);
    await this.finalize.refreshGroupStatus(asset.recordingId);
  }

  async finalizeRecording(
    recordingId: string,
    options?: { meetingEnded?: boolean },
  ): Promise<VideoMeetingRecordingGroupDto> {
    const recording = await this.prisma.videoMeetingRecording.findUniqueOrThrow({
      where: { id: recordingId },
      include: { assets: true },
    });

    await this.prisma.videoMeetingRecording.update({
      where: { id: recordingId },
      data: {
        status: VideoMeetingRecordingStatus.FINALIZING,
        stoppedAt: new Date(),
      },
    });

    for (const asset of recording.assets) {
      if (asset.egressId && this.egress?.isConfigured()) {
        await this.egress.stopEgress(asset.egressId);
      }
      if (asset.objectKey) {
        await this.finalize.finalizeAsset(asset.id);
      } else if (asset.status === VideoMeetingRecordingAssetStatus.PENDING) {
        await this.prisma.videoMeetingRecordingAsset.update({
          where: { id: asset.id },
          data: { status: VideoMeetingRecordingAssetStatus.FAILED, rangeEndsAt: new Date() },
        });
      }
    }

    const assets = await this.prisma.videoMeetingRecordingAsset.findMany({
      where: { recordingId },
    });
    const nextStatus = deriveRecordingGroupStatus(assets, {
      meetingEnded: options?.meetingEnded,
    });
    const updated = await this.prisma.videoMeetingRecording.update({
      where: { id: recordingId },
      data: { status: nextStatus },
      include: { assets: true },
    });
    return serializeRecordingGroup(updated);
  }

  async findActiveRecording(meetingId: string): Promise<RecordingWithAssets | null> {
    return this.prisma.videoMeetingRecording.findFirst({
      where: {
        meetingId,
        status: {
          in: [
            VideoMeetingRecordingStatus.PENDING,
            VideoMeetingRecordingStatus.RECORDING,
            VideoMeetingRecordingStatus.FINALIZING,
          ],
        },
      },
      include: { assets: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
