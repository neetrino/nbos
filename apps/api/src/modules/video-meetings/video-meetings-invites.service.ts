import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient, VideoMeetingStatus, type Prisma } from '@nbos/database';
import {
  digestVideoMeetingInviteToken,
  generateVideoMeetingInviteToken,
  isInviteAdmissible,
} from '@nbos/shared';
import { PRISMA_TOKEN } from '../../database.module';
import type { CurrentUserPayload } from '../../common/decorators';

type VideoMeetingInviteRow = Prisma.VideoMeetingInviteGetPayload<object>;

export type CreateInviteResult = {
  id: string;
  meetingId: string;
  expiresAt: string;
  /** Raw invite secret — returned ONCE; never persisted. */
  token: string;
  revokedAt: null;
};

export type InviteListItemDto = {
  id: string;
  meetingId: string;
  expiresAt: string;
  revokedAt: string | null;
  createdAt: string;
};

@Injectable()
export class VideoMeetingsInvitesService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async create(
    user: CurrentUserPayload,
    meetingId: string,
    expiresAt: Date,
  ): Promise<CreateInviteResult> {
    await this.requireHostOrOwner(meetingId, user.id);
    if (expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('Invite expiry must be in the future');
    }
    const token = generateVideoMeetingInviteToken();
    const tokenDigest = digestVideoMeetingInviteToken(token);
    const invite = await this.prisma.videoMeetingInvite.create({
      data: {
        meetingId,
        tokenDigest,
        expiresAt,
        createdByEmployeeId: user.id,
      },
    });
    return {
      id: invite.id,
      meetingId: invite.meetingId,
      expiresAt: invite.expiresAt.toISOString(),
      token,
      revokedAt: null,
    };
  }

  async revoke(
    user: CurrentUserPayload,
    meetingId: string,
    inviteId: string,
  ): Promise<InviteListItemDto> {
    await this.requireHostOrOwner(meetingId, user.id);
    const invite = await this.prisma.videoMeetingInvite.findFirst({
      where: { id: inviteId, meetingId },
    });
    if (!invite) throw new NotFoundException('Invite not found');
    if (invite.revokedAt) {
      return serializeInvite(invite);
    }
    const updated = await this.prisma.videoMeetingInvite.update({
      where: { id: inviteId },
      data: { revokedAt: new Date() },
    });
    return serializeInvite(updated);
  }

  async list(user: CurrentUserPayload, meetingId: string): Promise<InviteListItemDto[]> {
    await this.requireHostOrOwner(meetingId, user.id);
    const rows = await this.prisma.videoMeetingInvite.findMany({
      where: { meetingId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(serializeInvite);
  }

  /** Resolve invite by plaintext secret; returns null when digest unknown. */
  async findAdmissibleBySecret(tokenPlaintext: string): Promise<VideoMeetingInviteRow | null> {
    const tokenDigest = digestVideoMeetingInviteToken(tokenPlaintext);
    const invite = await this.prisma.videoMeetingInvite.findUnique({
      where: { tokenDigest },
    });
    if (!invite) return null;
    if (
      !isInviteAdmissible({
        tokenDigest: invite.tokenDigest,
        tokenPlaintext: null,
        expiresAt: invite.expiresAt,
        revokedAt: invite.revokedAt,
      })
    ) {
      return null;
    }
    return invite;
  }

  private async requireHostOrOwner(meetingId: string, employeeId: string) {
    const meeting = await this.prisma.videoMeeting.findUnique({ where: { id: meetingId } });
    if (!meeting) throw new NotFoundException('Meeting not found');
    if (meeting.hostEmployeeId !== employeeId && meeting.ownerEmployeeId !== employeeId) {
      throw new ForbiddenException('Only host or owner may manage invites');
    }
    if (
      meeting.status === VideoMeetingStatus.ENDED ||
      meeting.status === VideoMeetingStatus.CANCELLED
    ) {
      throw new BadRequestException('Cannot manage invites for an ended or cancelled meeting');
    }
    return meeting;
  }
}

function serializeInvite(invite: VideoMeetingInviteRow): InviteListItemDto {
  return {
    id: invite.id,
    meetingId: invite.meetingId,
    expiresAt: invite.expiresAt.toISOString(),
    revokedAt: invite.revokedAt ? invite.revokedAt.toISOString() : null,
    createdAt: invite.createdAt.toISOString(),
  };
}
