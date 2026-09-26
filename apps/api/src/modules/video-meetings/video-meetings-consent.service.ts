import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PrismaClient,
  VideoMeetingConsentDecision,
  type VideoMeetingConsentDecision as ConsentDecision,
} from '@nbos/database';
import { isConsentGranted } from '@nbos/shared';
import { PRISMA_TOKEN } from '../../database.module';
import type { CurrentUserPayload } from '../../common/decorators';
import { VideoMeetingsInvitesService } from './video-meetings-invites.service';
import {
  VIDEO_MEETING_RECORDING_NOTICE_COPY,
  VIDEO_MEETING_RECORDING_NOTICE_VERSION,
} from './video-meetings-recording.constants';

export type ConsentDecisionDto = 'GRANTED' | 'DECLINED' | 'REVOKED';

export type ConsentResultDto = {
  participantId: string;
  noticeVersion: string;
  noticeCopy: string;
  decision: ConsentDecisionDto | 'UNKNOWN';
  decidedAt: string | null;
};

const ALLOWED: ReadonlySet<ConsentDecisionDto> = new Set(['GRANTED', 'DECLINED', 'REVOKED']);

@Injectable()
export class VideoMeetingsConsentService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly invites: VideoMeetingsInvitesService,
  ) {}

  getNotice(): { noticeVersion: string; noticeCopy: string } {
    return {
      noticeVersion: VIDEO_MEETING_RECORDING_NOTICE_VERSION,
      noticeCopy: VIDEO_MEETING_RECORDING_NOTICE_COPY,
    };
  }

  async decideForEmployee(
    user: CurrentUserPayload,
    meetingId: string,
    decision: ConsentDecisionDto,
  ): Promise<ConsentResultDto> {
    assertDecision(decision);
    const participant = await this.prisma.videoMeetingParticipant.findFirst({
      where: { meetingId, employeeId: user.id },
    });
    if (!participant) {
      throw new NotFoundException('Participant not found for this employee');
    }
    return this.upsertDecision(meetingId, participant.id, decision, participant.sessionId);
  }

  async decideForGuest(
    inviteToken: string,
    decision: ConsentDecisionDto,
  ): Promise<ConsentResultDto> {
    assertDecision(decision);
    const invite = await this.invites.findAdmissibleBySecret(inviteToken);
    if (!invite) {
      throw new NotFoundException('Invite not found or not admissible');
    }
    const participant = await this.prisma.videoMeetingParticipant.findFirst({
      where: { inviteId: invite.id },
    });
    if (!participant) {
      throw new NotFoundException('Guest participant not found');
    }
    return this.upsertDecision(invite.meetingId, participant.id, decision, participant.sessionId);
  }

  async getLatestForParticipant(participantId: string) {
    return this.prisma.videoMeetingConsent.findFirst({
      where: { participantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listLatestByParticipantIds(participantIds: readonly string[]) {
    if (participantIds.length === 0) return new Map<string, { decision: ConsentDecision }>();
    const rows = await this.prisma.videoMeetingConsent.findMany({
      where: { participantId: { in: [...participantIds] } },
      orderBy: { createdAt: 'desc' },
    });
    const map = new Map<string, { decision: ConsentDecision }>();
    for (const row of rows) {
      if (!map.has(row.participantId)) {
        map.set(row.participantId, { decision: row.decision });
      }
    }
    return map;
  }

  isGranted(decision: ConsentDecision | undefined | null): boolean {
    return isConsentGranted(decision ? { decision } : null);
  }

  private async upsertDecision(
    meetingId: string,
    participantId: string,
    decision: ConsentDecisionDto,
    sessionId: string | null,
  ): Promise<ConsentResultDto> {
    const now = new Date();
    const row = await this.prisma.videoMeetingConsent.create({
      data: {
        meetingId,
        participantId,
        sessionId,
        noticeVersion: VIDEO_MEETING_RECORDING_NOTICE_VERSION,
        decision: decision as VideoMeetingConsentDecision,
        decidedAt: now,
      },
    });
    return {
      participantId,
      noticeVersion: row.noticeVersion,
      noticeCopy: VIDEO_MEETING_RECORDING_NOTICE_COPY,
      decision: row.decision as ConsentDecisionDto | 'UNKNOWN',
      decidedAt: row.decidedAt?.toISOString() ?? null,
    };
  }
}

function assertDecision(decision: string): asserts decision is ConsentDecisionDto {
  if (!ALLOWED.has(decision as ConsentDecisionDto)) {
    throw new BadRequestException('Invalid consent decision');
  }
}

/** Employee may only decide for themselves (already scoped by employeeId lookup). */
export function assertSelfOnlyConsent(_userId: string): void {
  void _userId;
  // Ownership enforced by participant.employeeId === user.id in decideForEmployee.
}

export function assertGuestInviteOwnsParticipant(
  inviteParticipantId: string,
  targetParticipantId: string,
): void {
  if (inviteParticipantId !== targetParticipantId) {
    throw new ForbiddenException('Guests may only decide consent for themselves');
  }
}
