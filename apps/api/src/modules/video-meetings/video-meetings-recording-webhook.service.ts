import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import type { WebhookEvent } from 'livekit-server-sdk';
import { TrackType } from 'livekit-server-sdk';
import { PRISMA_TOKEN } from '../../database.module';
import { VideoMeetingsRecordingService } from './video-meetings-recording.service';
import { closeMeetingAfterLiveKitRoomFinished } from './video-meetings-room-finished';

/**
 * Handles LiveKit egress + track webhooks for consented recording.
 * Deduplicates by egress id via RecordingService.applyEgressEnded.
 */
@Injectable()
export class VideoMeetingsRecordingWebhookService {
  private readonly logger = new Logger(VideoMeetingsRecordingWebhookService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly recordings: VideoMeetingsRecordingService,
  ) {}

  async handleEvent(event: WebhookEvent): Promise<void> {
    const name = event.event;
    if (name === 'egress_ended' || name === 'egress_updated') {
      const egressId = event.egressInfo?.egressId;
      if (!egressId) return;
      if (name === 'egress_ended') {
        await this.recordings.applyEgressEnded(egressId);
      }
      return;
    }

    if (name === 'track_published') {
      await this.onTrackPublished(event);
      return;
    }

    if (name === 'track_unpublished') {
      await this.onTrackUnpublished(event);
      return;
    }

    if (name === 'room_finished') {
      await this.onRoomFinished(event);
    }
  }

  private async onRoomFinished(event: WebhookEvent): Promise<void> {
    const roomName = event.room?.name;
    if (!roomName) return;
    const closed = await closeMeetingAfterLiveKitRoomFinished(
      this.prisma,
      this.recordings,
      roomName,
    );
    if (closed) {
      this.logger.log(`Closed meeting after LiveKit room finished: ${roomName}`);
    }
  }

  private async onTrackPublished(event: WebhookEvent): Promise<void> {
    const track = event.track;
    const roomName = event.room?.name;
    const participantId = event.participant?.identity;
    if (!track?.sid || !roomName || !participantId) return;
    // Audio only — video tracks are covered by room composite.
    if (track.type !== TrackType.AUDIO) return;

    const session = await this.prisma.videoMeetingSession.findFirst({
      where: { livekitRoomName: roomName, endedAt: null },
    });
    if (!session) return;

    await this.recordings.startAudioSegmentForTrack({
      meetingId: session.meetingId,
      participantId,
      trackId: track.sid,
      roomName,
    });
  }

  private async onTrackUnpublished(event: WebhookEvent): Promise<void> {
    const trackId = event.track?.sid;
    if (!trackId) return;
    await this.recordings.closeSegmentForTrack(null, trackId);
    this.logger.log(`Closed recording segment for unpublished track ${trackId}`);
  }
}
