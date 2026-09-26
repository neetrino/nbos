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
import {
  VIDEO_MEETINGS_EGRESS_CLIENT_TOKEN,
  VIDEO_MEETINGS_RECORDING_OBJECT_STORE_TOKEN,
} from './video-meetings-recording.constants';
import { buildParticipantAudioObjectKey } from './video-meetings-recording-keys';
import {
  assetStatusFromObjectHead,
  deriveRecordingGroupStatus,
} from './video-meetings-recording-status';
import type {
  VideoMeetingsEgressClient,
  VideoMeetingsRecordingObjectStore,
} from './video-meetings-egress.types';
import {
  serializeRecordingGroup,
  type VideoMeetingRecordingGroupDto,
} from './video-meetings-recording.serializer';

type RecordingWithAssets = Prisma.VideoMeetingRecordingGetPayload<{
  include: { assets: true };
}>;

/** Late-join segments, consent withdrawal, egress-ended verification. */
@Injectable()
export class VideoMeetingsRecordingLifecycleService {
  private readonly logger = new Logger(VideoMeetingsRecordingLifecycleService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly consent: VideoMeetingsConsentService,
    @Optional()
    @Inject(VIDEO_MEETINGS_EGRESS_CLIENT_TOKEN)
    private readonly egress: VideoMeetingsEgressClient | null,
    @Optional()
    @Inject(VIDEO_MEETINGS_RECORDING_OBJECT_STORE_TOKEN)
    private readonly objectStore: VideoMeetingsRecordingObjectStore | null,
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

  async stopParticipantAudioOnWithdrawal(meetingId: string, participantId: string): Promise<void> {
    const recording = await this.findActiveRecording(meetingId);
    if (!recording) return;
    const active = recording.assets.filter(
      (a) =>
        a.participantId === participantId &&
        a.kind === VideoMeetingRecordingAssetKind.PARTICIPANT_AUDIO &&
        a.egressId &&
        a.status === VideoMeetingRecordingAssetStatus.PENDING,
    );
    for (const asset of active) {
      if (asset.egressId && this.egress?.isConfigured()) {
        await this.egress.stopEgress(asset.egressId);
      }
      await this.prisma.videoMeetingRecordingAsset.update({
        where: { id: asset.id },
        data: { rangeEndsAt: new Date() },
      });
      if (asset.objectKey) {
        await this.verifyAssetObject(asset.id, asset.objectKey);
      }
    }
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
    await this.verifyAssetObject(asset.id, asset.objectKey);
    await this.refreshGroupAfterAssetChange(asset.recordingId);
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
        await this.verifyAssetObject(asset.id, asset.objectKey);
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

  async verifyAssetObject(assetId: string, objectKey: string): Promise<void> {
    if (!this.objectStore?.isConfigured()) {
      await this.prisma.videoMeetingRecordingAsset.update({
        where: { id: assetId },
        data: { status: VideoMeetingRecordingAssetStatus.PENDING },
      });
      return;
    }
    const head = await this.objectStore.headObject(objectKey);
    const status = assetStatusFromObjectHead(head);
    await this.prisma.videoMeetingRecordingAsset.update({
      where: { id: assetId },
      data: {
        status,
        rangeEndsAt: new Date(),
        fileAssetId: null,
      },
    });
  }

  private async refreshGroupAfterAssetChange(recordingId: string): Promise<void> {
    const recording = await this.prisma.videoMeetingRecording.findUnique({
      where: { id: recordingId },
      include: { assets: true },
    });
    if (!recording) return;
    if (
      recording.status === VideoMeetingRecordingStatus.RECORDING ||
      recording.status === VideoMeetingRecordingStatus.PENDING
    ) {
      return;
    }
    const next = deriveRecordingGroupStatus(recording.assets);
    if (next !== recording.status) {
      await this.prisma.videoMeetingRecording.update({
        where: { id: recordingId },
        data: { status: next },
      });
    }
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
