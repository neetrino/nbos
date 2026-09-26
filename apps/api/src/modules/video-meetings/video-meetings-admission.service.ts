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
  type VideoMeetingConsentDecision,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import type { CurrentUserPayload } from '../../common/decorators';
import {
  ensureEmployeeParticipant,
  requireActiveSession,
  requireGuestParticipant,
  requireHostOrOwner,
} from './video-meetings-admission-guards';
import { VideoMeetingsConsentService } from './video-meetings-consent.service';
import {
  buildEmployeeDisplayName,
  isMeetingAccessible,
  mapAdmissionStatus,
} from './video-meetings-guest-safety';
import { VideoMeetingsInvitesService } from './video-meetings-invites.service';
import { VideoMeetingsLivekitService } from './video-meetings-livekit.service';
import { loadVideoMeetingPublishGate } from './video-meetings-publish-gate';

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
    private readonly consent: VideoMeetingsConsentService,
  ) {}

  async listWaiting(user: CurrentUserPayload, meetingId: string): Promise<WaitingParticipantDto[]> {
    await requireHostOrOwner(this.prisma, meetingId, user.id);
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
    await requireHostOrOwner(this.prisma, meetingId, user.id);
    const participant = await requireGuestParticipant(this.prisma, meetingId, participantId);
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
    await requireHostOrOwner(this.prisma, meetingId, user.id);
    await requireGuestParticipant(this.prisma, meetingId, participantId);
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
    const session = await requireActiveSession(this.prisma, invite.meetingId);
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
    const session = await requireActiveSession(this.prisma, invite.meetingId);
    const creds = await this.mintWithPublishGate({
      meetingId: invite.meetingId,
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
    const session = await requireActiveSession(this.prisma, meetingId);
    const displayName = buildEmployeeDisplayName(user);
    const participant = await ensureEmployeeParticipant(
      this.prisma,
      meetingId,
      session.id,
      user.id,
      displayName,
      meeting.participants[0] ?? null,
    );
    const creds = await this.mintWithPublishGate({
      meetingId,
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

  private async mintWithPublishGate(input: {
    meetingId: string;
    roomName: string;
    participantId: string;
    displayName: string;
    role: 'host' | 'guest';
    requestedRoomName?: string;
  }) {
    const gate = await loadVideoMeetingPublishGate(
      this.prisma.videoMeetingRecording,
      {
        getLatestForParticipant: (id) => this.consent.getLatestForParticipant(id),
        isGranted: (decision) =>
          this.consent.isGranted(decision as VideoMeetingConsentDecision | null),
      },
      input.meetingId,
      input.participantId,
    );
    return this.livekit.mintJoinToken({
      roomName: input.roomName,
      participantId: input.participantId,
      displayName: input.displayName,
      role: input.role,
      requestedRoomName: input.requestedRoomName,
      recordingActive: gate.recordingActive,
      consentGranted: gate.consentGranted,
    });
  }
}
