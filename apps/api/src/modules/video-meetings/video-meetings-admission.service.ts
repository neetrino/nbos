import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  PrismaClient,
  VideoMeetingAdmissionStatus,
  VideoMeetingParticipantKind,
  VideoMeetingStatus,
  type Prisma,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import type { CurrentUserPayload } from '../../common/decorators';
import {
  buildEmployeeDisplayName,
  isMeetingAccessible,
  mapAdmissionStatus,
} from './video-meetings-guest-safety';
import { VideoMeetingsInvitesService } from './video-meetings-invites.service';
import { VideoMeetingsLivekitService } from './video-meetings-livekit.service';

type VideoMeetingSessionRow = Prisma.VideoMeetingSessionGetPayload<object>;

export type WaitingParticipantDto = {
  participantId: string;
  displayName: string;
  admissionStatus: 'WAITING';
  createdAt: string;
};

export type GuestPrejoinResult = {
  admissionState: 'WAITING' | 'ADMITTED' | 'REJECTED';
  participantId: string;
  displayName: string;
};

export type GuestJoinResult = {
  admissionState: 'ADMITTED';
  livekitUrl: string;
  token: string;
  roomName: string;
  participantId: string;
  displayName: string;
};

export type EmployeeTokenResult = {
  livekitUrl: string;
  token: string;
  roomName: string;
  participantId: string;
  displayName: string;
};

@Injectable()
export class VideoMeetingsAdmissionService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly invites: VideoMeetingsInvitesService,
    private readonly livekit: VideoMeetingsLivekitService,
  ) {}

  async listWaiting(user: CurrentUserPayload, meetingId: string): Promise<WaitingParticipantDto[]> {
    await this.requireHostOrOwner(meetingId, user.id);
    const rows = await this.prisma.videoMeetingParticipant.findMany({
      where: {
        meetingId,
        kind: VideoMeetingParticipantKind.GUEST,
        admissionStatus: VideoMeetingAdmissionStatus.WAITING,
      },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => ({
      participantId: row.id,
      displayName: row.displayName,
      admissionStatus: 'WAITING' as const,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async admit(
    user: CurrentUserPayload,
    meetingId: string,
    participantId: string,
  ): Promise<{ participantId: string; admissionStatus: 'ADMITTED' }> {
    await this.requireHostOrOwner(meetingId, user.id);
    const participant = await this.requireGuestParticipant(meetingId, participantId);
    if (participant.admissionStatus === VideoMeetingAdmissionStatus.REJECTED) {
      throw new BadRequestException('Cannot admit a rejected participant');
    }
    const updated = await this.prisma.videoMeetingParticipant.update({
      where: { id: participantId },
      data: {
        admissionStatus: VideoMeetingAdmissionStatus.ADMITTED,
        joinedAt: participant.joinedAt ?? new Date(),
      },
    });
    return { participantId: updated.id, admissionStatus: 'ADMITTED' };
  }

  async reject(
    user: CurrentUserPayload,
    meetingId: string,
    participantId: string,
  ): Promise<{ participantId: string; admissionStatus: 'REJECTED' }> {
    await this.requireHostOrOwner(meetingId, user.id);
    await this.requireGuestParticipant(meetingId, participantId);
    const updated = await this.prisma.videoMeetingParticipant.update({
      where: { id: participantId },
      data: {
        admissionStatus: VideoMeetingAdmissionStatus.REJECTED,
        leftAt: new Date(),
      },
    });
    return { participantId: updated.id, admissionStatus: 'REJECTED' };
  }

  /** Guest prejoin: create or reuse waiting participant; never returns a JWT. */
  async guestPrejoin(inviteToken: string, displayNameRaw: string): Promise<GuestPrejoinResult> {
    const displayName = displayNameRaw.trim();
    if (!displayName) throw new BadRequestException('Display name is required');
    const invite = await this.invites.findAdmissibleBySecret(inviteToken);
    if (!invite) throw new NotFoundException('Invite not found or not admissible');
    const session = await this.requireActiveSession(invite.meetingId);
    const existing = await this.prisma.videoMeetingParticipant.findUnique({
      where: { inviteId: invite.id },
    });
    if (existing) {
      if (existing.displayName !== displayName) {
        await this.prisma.videoMeetingParticipant.update({
          where: { id: existing.id },
          data: { displayName, sessionId: session.id },
        });
      }
      return {
        admissionState: mapAdmissionStatus(existing.admissionStatus),
        participantId: existing.id,
        displayName,
      };
    }
    const created = await this.prisma.videoMeetingParticipant.create({
      data: {
        meetingId: invite.meetingId,
        sessionId: session.id,
        kind: VideoMeetingParticipantKind.GUEST,
        employeeId: null,
        inviteId: invite.id,
        displayName,
        admissionStatus: VideoMeetingAdmissionStatus.WAITING,
      },
    });
    return {
      admissionState: 'WAITING',
      participantId: created.id,
      displayName: created.displayName,
    };
  }

  /** Guest token exchange — JWT only after host admission. */
  async guestToken(inviteToken: string, requestedRoomName?: string): Promise<GuestJoinResult> {
    if (!this.livekit.isConfigured()) {
      throw new ServiceUnavailableException('LiveKit is not configured');
    }
    const invite = await this.invites.findAdmissibleBySecret(inviteToken);
    if (!invite) throw new NotFoundException('Invite not found or not admissible');
    const participant = await this.prisma.videoMeetingParticipant.findUnique({
      where: { inviteId: invite.id },
    });
    if (!participant) {
      throw new BadRequestException('Complete prejoin before requesting a token');
    }
    if (participant.admissionStatus !== VideoMeetingAdmissionStatus.ADMITTED) {
      throw new ForbiddenException('Guest is not admitted');
    }
    const session = await this.requireActiveSession(invite.meetingId);
    const creds = await this.livekit.mintJoinToken({
      roomName: session.livekitRoomName,
      participantId: participant.id,
      displayName: participant.displayName,
      role: 'guest',
      requestedRoomName,
    });
    return {
      admissionState: 'ADMITTED',
      livekitUrl: creds.livekitUrl,
      token: creds.token,
      roomName: creds.roomName,
      participantId: participant.id,
      displayName: participant.displayName,
    };
  }

  /** Employee join token — reuses stable participant id on reconnect. */
  async employeeToken(
    user: CurrentUserPayload,
    meetingId: string,
    requestedRoomName?: string,
  ): Promise<EmployeeTokenResult> {
    if (!this.livekit.isConfigured()) {
      throw new ServiceUnavailableException('LiveKit is not configured');
    }
    const meeting = await this.prisma.videoMeeting.findUnique({
      where: { id: meetingId },
      include: { participants: { where: { employeeId: user.id } } },
    });
    if (!meeting || !isMeetingAccessible(meeting, user.id)) {
      throw new NotFoundException('Meeting not found');
    }
    if (meeting.status !== VideoMeetingStatus.ACTIVE) {
      throw new BadRequestException('Meeting is not active');
    }
    const session = await this.requireActiveSession(meetingId);
    const displayName = buildEmployeeDisplayName(user);
    const participant = await this.ensureEmployeeParticipant(
      meetingId,
      session.id,
      user.id,
      displayName,
      meeting.participants[0] ?? null,
    );
    const creds = await this.livekit.mintJoinToken({
      roomName: session.livekitRoomName,
      participantId: participant.id,
      displayName,
      role: 'host',
      requestedRoomName,
    });
    return {
      livekitUrl: creds.livekitUrl,
      token: creds.token,
      roomName: creds.roomName,
      participantId: participant.id,
      displayName,
    };
  }

  /** Resolve meeting id for an admissible guest invite (no secrets returned). */
  async resolveGuestMeetingId(inviteToken: string): Promise<{ meetingId: string } | null> {
    const invite = await this.invites.findAdmissibleBySecret(inviteToken);
    if (!invite) return null;
    return { meetingId: invite.meetingId };
  }

  private async ensureEmployeeParticipant(
    meetingId: string,
    sessionId: string,
    employeeId: string,
    displayName: string,
    existing: { id: string; admissionStatus: VideoMeetingAdmissionStatus } | null,
  ) {
    if (!existing) {
      return this.prisma.videoMeetingParticipant.create({
        data: {
          meetingId,
          sessionId,
          kind: VideoMeetingParticipantKind.EMPLOYEE,
          employeeId,
          displayName,
          admissionStatus: VideoMeetingAdmissionStatus.ADMITTED,
          joinedAt: new Date(),
        },
      });
    }
    if (existing.admissionStatus !== VideoMeetingAdmissionStatus.ADMITTED) {
      throw new ForbiddenException('Employee is not admitted');
    }
    await this.prisma.videoMeetingParticipant.update({
      where: { id: existing.id },
      data: { sessionId, displayName, leftAt: null },
    });
    return existing;
  }

  private async requireGuestParticipant(meetingId: string, participantId: string) {
    const participant = await this.prisma.videoMeetingParticipant.findFirst({
      where: { id: participantId, meetingId, kind: VideoMeetingParticipantKind.GUEST },
    });
    if (!participant) throw new NotFoundException('Participant not found');
    return participant;
  }

  private async requireHostOrOwner(meetingId: string, employeeId: string) {
    const meeting = await this.prisma.videoMeeting.findUnique({ where: { id: meetingId } });
    if (!meeting) throw new NotFoundException('Meeting not found');
    if (meeting.hostEmployeeId !== employeeId && meeting.ownerEmployeeId !== employeeId) {
      throw new ForbiddenException('Only host or owner may manage admission');
    }
    return meeting;
  }

  private async requireActiveSession(meetingId: string): Promise<VideoMeetingSessionRow> {
    const session = await this.prisma.videoMeetingSession.findFirst({
      where: { meetingId, endedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!session) throw new BadRequestException('Meeting has no active session');
    return session;
  }
}
