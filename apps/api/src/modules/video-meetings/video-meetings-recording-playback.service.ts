import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  PrismaClient,
  VideoMeetingRecordingAssetKind,
  VideoMeetingRecordingAssetStatus,
} from '@nbos/database';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PRISMA_TOKEN } from '../../database.module';
import type { CurrentUserPayload } from '../../common/decorators';
import { DriveR2Client } from '../drive/drive-r2.client';
import { isVideoMeetingAccessible } from './video-meetings-access-query';
import { VIDEO_MEETING_PLAYBACK_URL_TTL_SECONDS } from './video-meetings-recording.constants';

export type VideoMeetingPlaybackDto = {
  assetId: string;
  kind: 'ROOM_COMPOSITE';
  url: string;
  mimeType: string;
  expiresInSeconds: number;
};

/**
 * Short-lived Drive-signed playback for the composite only.
 * Guests never; entity links never widen ACL; host/owner/participant only.
 */
@Injectable()
export class VideoMeetingsRecordingPlaybackService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly r2: DriveR2Client,
  ) {}

  async getCompositePlayback(
    user: CurrentUserPayload,
    meetingId: string,
  ): Promise<VideoMeetingPlaybackDto> {
    await this.requireMeetingViewer(meetingId, user.id);

    const asset = await this.prisma.videoMeetingRecordingAsset.findFirst({
      where: {
        kind: VideoMeetingRecordingAssetKind.ROOM_COMPOSITE,
        status: VideoMeetingRecordingAssetStatus.READY,
        fileAssetId: { not: null },
        recording: { meetingId },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        recording: { select: { meetingId: true } },
      },
    });
    if (!asset?.fileAssetId) {
      throw new NotFoundException('Composite recording is not ready');
    }

    const file = await this.prisma.fileAsset.findFirst({
      where: { id: asset.fileAssetId, deletedAt: null },
      include: {
        versions: { where: { isCurrent: true }, take: 1, orderBy: { versionNumber: 'desc' } },
      },
    });
    if (!file) throw new NotFoundException('Recording file asset not found');

    const key = file.versions[0]?.storageKey ?? file.storageKey;
    if (!key) throw new NotFoundException('Recording has no storage key');

    let url: string;
    try {
      const command = new GetObjectCommand({
        Bucket: this.r2.bucket,
        Key: key,
        ResponseContentType: file.mimeType ?? undefined,
      });
      url = await getSignedUrl(this.r2.ensureS3(), command, {
        expiresIn: VIDEO_MEETING_PLAYBACK_URL_TTL_SECONDS,
      });
    } catch {
      throw new ServiceUnavailableException('Recording playback storage is unavailable');
    }

    return {
      assetId: asset.id,
      kind: 'ROOM_COMPOSITE',
      url,
      mimeType: file.mimeType ?? 'video/mp4',
      expiresInSeconds: VIDEO_MEETING_PLAYBACK_URL_TTL_SECONDS,
    };
  }

  private async requireMeetingViewer(meetingId: string, employeeId: string): Promise<void> {
    const meeting = await this.prisma.videoMeeting.findUnique({
      where: { id: meetingId },
      include: { participants: { select: { employeeId: true } } },
    });
    if (!meeting) throw new NotFoundException('Meeting not found');
    if (!isVideoMeetingAccessible(meeting, employeeId)) {
      throw new ForbiddenException('Not authorized to play this meeting recording');
    }
  }
}
