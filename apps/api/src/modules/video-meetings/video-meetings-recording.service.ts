import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PrismaClient,
  VideoMeetingRecordingAssetKind,
  VideoMeetingRecordingAssetStatus,
  VideoMeetingRecordingStatus,
  VideoMeetingStatus,
} from '@nbos/database';
import { isRecordingEligibleFromConsents } from '@nbos/shared';
import { PRISMA_TOKEN } from '../../database.module';
import type { CurrentUserPayload } from '../../common/decorators';
import { VideoMeetingsConsentService } from './video-meetings-consent.service';
import {
  VIDEO_MEETINGS_EGRESS_CLIENT_TOKEN,
  VIDEO_MEETINGS_RECORDING_OBJECT_STORE_TOKEN,
} from './video-meetings-recording.constants';
import {
  buildCompositeObjectKey,
  buildParticipantAudioObjectKey,
} from './video-meetings-recording-keys';
import type {
  VideoMeetingsEgressClient,
  VideoMeetingsRecordingObjectStore,
} from './video-meetings-egress.types';
import { assertRecordingCapacityAvailable } from './video-meetings-recording-capacity';
import { VideoMeetingsRecordingLifecycleService } from './video-meetings-recording-lifecycle.service';
import {
  serializeRecordingGroup,
  type VideoMeetingRecordingGroupDto,
} from './video-meetings-recording.serializer';

@Injectable()
export class VideoMeetingsRecordingService {
  private readonly logger = new Logger(VideoMeetingsRecordingService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly consent: VideoMeetingsConsentService,
    private readonly lifecycle: VideoMeetingsRecordingLifecycleService,
    private readonly config: ConfigService,
    @Optional()
    @Inject(VIDEO_MEETINGS_EGRESS_CLIENT_TOKEN)
    private readonly egress: VideoMeetingsEgressClient | null,
    @Optional()
    @Inject(VIDEO_MEETINGS_RECORDING_OBJECT_STORE_TOKEN)
    private readonly objectStore: VideoMeetingsRecordingObjectStore | null,
  ) {}

  async start(
    user: CurrentUserPayload,
    meetingId: string,
  ): Promise<{ recording: VideoMeetingRecordingGroupDto }> {
    this.requireEgressConfigured();
    const meeting = await this.requireHostOrOwner(meetingId, user.id);
    if (meeting.status !== VideoMeetingStatus.ACTIVE) {
      throw new BadRequestException('Meeting must be ACTIVE to start recording');
    }
    await assertRecordingCapacityAvailable(this.prisma, this.config);
    const session = await this.prisma.videoMeetingSession.findFirst({
      where: { meetingId, endedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!session) {
      throw new BadRequestException('No active session for this meeting');
    }

    const existing = await this.lifecycle.findActiveRecording(meetingId);
    if (
      existing &&
      (existing.status === VideoMeetingRecordingStatus.PENDING ||
        existing.status === VideoMeetingRecordingStatus.RECORDING)
    ) {
      throw new BadRequestException('A recording is already in progress; stop it before restart');
    }

    const identities = await this.egress!.listParticipantIdentities(session.livekitRoomName);
    if (identities.length === 0) {
      throw new BadRequestException('No capturable participants in the room');
    }

    const consentMap = await this.consent.listLatestByParticipantIds(identities);
    const snapshots = identities.map((id) => {
      const row = consentMap.get(id);
      return row ? { decision: row.decision } : null;
    });
    if (!isRecordingEligibleFromConsents(snapshots)) {
      throw new BadRequestException(
        'Recording denied: every capturable participant must have affirmative GRANTED consent',
      );
    }

    const audioTracks = await this.egress!.listPublishedAudioTracks(session.livekitRoomName);
    const consentedAudio = audioTracks.filter((t) =>
      this.consent.isGranted(consentMap.get(t.participantId)?.decision),
    );

    const recording = await this.prisma.videoMeetingRecording.create({
      data: {
        meetingId,
        sessionId: session.id,
        status: VideoMeetingRecordingStatus.PENDING,
        startedAt: new Date(),
      },
    });

    const compositeKey = buildCompositeObjectKey(meetingId, recording.id);
    const compositeAsset = await this.prisma.videoMeetingRecordingAsset.create({
      data: {
        recordingId: recording.id,
        kind: VideoMeetingRecordingAssetKind.ROOM_COMPOSITE,
        status: VideoMeetingRecordingAssetStatus.PENDING,
        objectKey: compositeKey,
      },
    });

    const audioAssets: Array<{
      id: string;
      trackId: string;
      objectKey: string;
    }> = [];
    for (const track of consentedAudio) {
      const objectKey = buildParticipantAudioObjectKey(
        meetingId,
        recording.id,
        track.participantId,
      );
      const asset = await this.prisma.videoMeetingRecordingAsset.create({
        data: {
          recordingId: recording.id,
          kind: VideoMeetingRecordingAssetKind.PARTICIPANT_AUDIO,
          status: VideoMeetingRecordingAssetStatus.PENDING,
          participantId: track.participantId,
          livekitTrackId: track.trackId,
          objectKey,
          rangeStartsAt: new Date(),
        },
      });
      audioAssets.push({ id: asset.id, trackId: track.trackId, objectKey });
    }

    try {
      const composite = await this.egress!.startRoomComposite(
        session.livekitRoomName,
        compositeKey,
      );
      await this.prisma.videoMeetingRecordingAsset.update({
        where: { id: compositeAsset.id },
        data: { egressId: composite.egressId },
      });
      for (const audio of audioAssets) {
        const started = await this.egress!.startTrackAudio(
          session.livekitRoomName,
          audio.trackId,
          audio.objectKey,
        );
        await this.prisma.videoMeetingRecordingAsset.update({
          where: { id: audio.id },
          data: { egressId: started.egressId },
        });
      }
    } catch (error) {
      this.logger.error(`Failed to start egress for recording ${recording.id}: ${String(error)}`);
      await this.prisma.videoMeetingRecording.update({
        where: { id: recording.id },
        data: { status: VideoMeetingRecordingStatus.FAILED, stoppedAt: new Date() },
      });
      throw new ServiceUnavailableException('Egress failed to start recording');
    }

    const updated = await this.prisma.videoMeetingRecording.update({
      where: { id: recording.id },
      data: { status: VideoMeetingRecordingStatus.RECORDING },
      include: { assets: true },
    });
    return { recording: serializeRecordingGroup(updated) };
  }

  async stop(
    user: CurrentUserPayload,
    meetingId: string,
  ): Promise<{ recording: VideoMeetingRecordingGroupDto }> {
    this.requireEgressConfigured();
    await this.requireHostOrOwner(meetingId, user.id);
    const recording = await this.lifecycle.findActiveRecording(meetingId);
    if (!recording) {
      throw new BadRequestException('No active recording to stop');
    }
    return { recording: await this.lifecycle.finalizeRecording(recording.id) };
  }

  async stopIfRecordingOnMeetingEnd(meetingId: string): Promise<void> {
    const recording = await this.lifecycle.findActiveRecording(meetingId);
    if (!recording) return;
    if (!this.egress?.isConfigured()) {
      await this.prisma.videoMeetingRecording.update({
        where: { id: recording.id },
        data: {
          status: VideoMeetingRecordingStatus.FINALIZING,
          stoppedAt: new Date(),
        },
      });
      return;
    }
    await this.lifecycle.finalizeRecording(recording.id, { meetingEnded: true });
  }

  async getActiveStatus(meetingId: string): Promise<VideoMeetingRecordingGroupDto | null> {
    const recording = await this.prisma.videoMeetingRecording.findFirst({
      where: { meetingId },
      orderBy: { createdAt: 'desc' },
      include: { assets: true },
    });
    return recording ? serializeRecordingGroup(recording) : null;
  }

  startAudioSegmentForTrack = (input: {
    meetingId: string;
    participantId: string;
    trackId: string;
    roomName: string;
  }) => this.lifecycle.startAudioSegmentForTrack(input);

  stopParticipantAudioOnWithdrawal = (meetingId: string, participantId: string) =>
    this.lifecycle.stopParticipantAudioOnWithdrawal(meetingId, participantId);

  closeSegmentForTrack = (egressId: string | null, trackId: string) =>
    this.lifecycle.closeSegmentForTrack(egressId, trackId);

  applyEgressEnded = (egressId: string) => this.lifecycle.applyEgressEnded(egressId);

  private requireEgressConfigured(): void {
    if (!this.egress?.isConfigured() || !this.objectStore?.isConfigured()) {
      throw new ServiceUnavailableException('Recording egress is not configured');
    }
  }

  private async requireHostOrOwner(meetingId: string, employeeId: string) {
    const meeting = await this.prisma.videoMeeting.findUnique({ where: { id: meetingId } });
    if (!meeting) throw new NotFoundException('Meeting not found');
    if (meeting.hostEmployeeId !== employeeId && meeting.ownerEmployeeId !== employeeId) {
      throw new ForbiddenException('Only host or owner may control recording');
    }
    return meeting;
  }
}
