import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  EmployeeStatusEnum,
  PrismaClient,
  VideoMeetingAdmissionStatus,
  VideoMeetingParticipantKind,
  VideoMeetingStatus,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import type { CurrentUserPayload } from '../../common/decorators';
import { NotificationService } from '../notifications/notification.service';
import { requireHostOrOwner } from './video-meetings-admission-guards';
import { buildEmployeeDisplayName } from './video-meetings-guest-safety';
import { VIDEO_MEETING_COLLEAGUE_INVITE_NOTIFICATION_TYPE } from './video-meetings.constants';

export type ColleagueInviteListItemDto = {
  participantId: string;
  employeeId: string;
  displayName: string;
  admissionStatus: 'WAITING' | 'ADMITTED' | 'REJECTED';
  createdAt: string;
};

export type PendingColleagueInviteDto = {
  meetingId: string;
  meetingTitle: string;
  meetingStatus: VideoMeetingStatus;
  participantId: string;
  invitedByEmployeeId: string;
  invitedByDisplayName: string;
  createdAt: string;
};

export type ColleagueInviteActionResult = {
  meetingId: string;
  participantId: string;
  admissionStatus: 'ADMITTED' | 'REJECTED';
  meetingStatus: VideoMeetingStatus;
};

@Injectable()
export class VideoMeetingsColleagueInvitesService {
  private readonly logger = new Logger(VideoMeetingsColleagueInvitesService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly notifications: NotificationService,
  ) {}

  async invite(
    user: CurrentUserPayload,
    meetingId: string,
    employeeIds: string[],
  ): Promise<ColleagueInviteListItemDto[]> {
    const meeting = await requireHostOrOwner(this.prisma, meetingId, user.id);
    assertMeetingOpenForInvites(meeting.status);
    const uniqueIds = [...new Set(employeeIds)].filter((id) => id !== user.id);
    if (uniqueIds.length === 0) {
      throw new BadRequestException('Select at least one colleague other than yourself');
    }
    const employees = await this.prisma.employee.findMany({
      where: { id: { in: uniqueIds }, status: EmployeeStatusEnum.ACTIVE },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    if (employees.length !== uniqueIds.length) {
      throw new BadRequestException('One or more employees were not found or are inactive');
    }
    const inviterName = buildEmployeeDisplayName(user);
    const results: ColleagueInviteListItemDto[] = [];
    for (const employee of employees) {
      const row = await this.upsertWaitingColleague(meetingId, employee);
      results.push(serializeColleague(row));
      await this.notifyColleague({
        recipientId: employee.id,
        meetingId,
        meetingTitle: meeting.title,
        inviterName,
      });
    }
    return results;
  }

  async listForMeeting(
    user: CurrentUserPayload,
    meetingId: string,
  ): Promise<ColleagueInviteListItemDto[]> {
    await requireHostOrOwner(this.prisma, meetingId, user.id);
    const rows = await this.prisma.videoMeetingParticipant.findMany({
      where: {
        meetingId,
        kind: VideoMeetingParticipantKind.EMPLOYEE,
        employeeId: { not: null },
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows
      .filter((row) => row.employeeId != null && row.employeeId !== user.id)
      .map(serializeColleague);
  }

  async listPending(user: CurrentUserPayload): Promise<PendingColleagueInviteDto[]> {
    const rows = await this.prisma.videoMeetingParticipant.findMany({
      where: {
        employeeId: user.id,
        kind: VideoMeetingParticipantKind.EMPLOYEE,
        admissionStatus: VideoMeetingAdmissionStatus.WAITING,
        meeting: {
          status: {
            notIn: [VideoMeetingStatus.ENDED, VideoMeetingStatus.CANCELLED],
          },
        },
      },
      include: {
        meeting: { select: { id: true, title: true, status: true, hostEmployeeId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (rows.length === 0) return [];
    const hostIds = [...new Set(rows.map((row) => row.meeting.hostEmployeeId))];
    const hosts = await this.prisma.employee.findMany({
      where: { id: { in: hostIds } },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    const hostById = new Map(hosts.map((host) => [host.id, host]));
    return rows.map((row) => {
      const host = hostById.get(row.meeting.hostEmployeeId);
      const invitedByDisplayName = host
        ? `${host.firstName} ${host.lastName}`.trim() || host.email
        : row.meeting.hostEmployeeId.slice(0, 8);
      return {
        meetingId: row.meeting.id,
        meetingTitle: row.meeting.title,
        meetingStatus: row.meeting.status,
        participantId: row.id,
        invitedByEmployeeId: row.meeting.hostEmployeeId,
        invitedByDisplayName,
        createdAt: row.createdAt.toISOString(),
      };
    });
  }

  async accept(user: CurrentUserPayload, meetingId: string): Promise<ColleagueInviteActionResult> {
    return this.respond(user, meetingId, VideoMeetingAdmissionStatus.ADMITTED);
  }

  async decline(user: CurrentUserPayload, meetingId: string): Promise<ColleagueInviteActionResult> {
    return this.respond(user, meetingId, VideoMeetingAdmissionStatus.REJECTED);
  }

  private async respond(
    user: CurrentUserPayload,
    meetingId: string,
    nextStatus:
      | typeof VideoMeetingAdmissionStatus.ADMITTED
      | typeof VideoMeetingAdmissionStatus.REJECTED,
  ): Promise<ColleagueInviteActionResult> {
    const meeting = await this.prisma.videoMeeting.findUnique({ where: { id: meetingId } });
    if (!meeting) throw new NotFoundException('Meeting not found');
    assertMeetingOpenForInvites(meeting.status);
    const participant = await this.prisma.videoMeetingParticipant.findFirst({
      where: {
        meetingId,
        employeeId: user.id,
        kind: VideoMeetingParticipantKind.EMPLOYEE,
      },
    });
    if (!participant) throw new NotFoundException('Colleague invite not found');
    if (participant.admissionStatus === nextStatus) {
      return {
        meetingId,
        participantId: participant.id,
        admissionStatus:
          nextStatus === VideoMeetingAdmissionStatus.ADMITTED ? 'ADMITTED' : 'REJECTED',
        meetingStatus: meeting.status,
      };
    }
    if (participant.admissionStatus !== VideoMeetingAdmissionStatus.WAITING) {
      throw new BadRequestException('Invite is no longer pending');
    }
    const admitted = nextStatus === VideoMeetingAdmissionStatus.ADMITTED;
    const updated = await this.prisma.videoMeetingParticipant.update({
      where: { id: participant.id },
      data: {
        admissionStatus: nextStatus,
        joinedAt: admitted ? (participant.joinedAt ?? new Date()) : participant.joinedAt,
        leftAt: admitted ? null : new Date(),
      },
    });
    return {
      meetingId,
      participantId: updated.id,
      admissionStatus: admitted ? 'ADMITTED' : 'REJECTED',
      meetingStatus: meeting.status,
    };
  }

  private async upsertWaitingColleague(
    meetingId: string,
    employee: { id: string; firstName: string; lastName: string; email: string },
  ) {
    const displayName = `${employee.firstName} ${employee.lastName}`.trim() || employee.email;
    const existing = await this.prisma.videoMeetingParticipant.findFirst({
      where: {
        meetingId,
        employeeId: employee.id,
        kind: VideoMeetingParticipantKind.EMPLOYEE,
      },
    });
    if (!existing) {
      return this.prisma.videoMeetingParticipant.create({
        data: {
          meetingId,
          kind: VideoMeetingParticipantKind.EMPLOYEE,
          employeeId: employee.id,
          displayName,
          admissionStatus: VideoMeetingAdmissionStatus.WAITING,
        },
      });
    }
    if (existing.admissionStatus === VideoMeetingAdmissionStatus.ADMITTED) {
      return existing;
    }
    return this.prisma.videoMeetingParticipant.update({
      where: { id: existing.id },
      data: {
        displayName,
        admissionStatus: VideoMeetingAdmissionStatus.WAITING,
        leftAt: null,
      },
    });
  }

  private async notifyColleague(params: {
    recipientId: string;
    meetingId: string;
    meetingTitle: string;
    inviterName: string;
  }): Promise<void> {
    try {
      await this.notifications.create({
        recipientId: params.recipientId,
        type: VIDEO_MEETING_COLLEAGUE_INVITE_NOTIFICATION_TYPE,
        sourceModule: 'VIDEO_MEETINGS',
        title: params.meetingTitle,
        body: `${params.inviterName} invited you to a video meeting`,
        link: `/video-meetings/${params.meetingId}`,
        actionLabel: 'Respond',
        entityType: 'VIDEO_MEETING',
        entityId: params.meetingId,
        category: 'collaboration',
        priority: 'high',
        dedupeKey: `${VIDEO_MEETING_COLLEAGUE_INVITE_NOTIFICATION_TYPE}:${params.meetingId}:${params.recipientId}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Colleague invite notification failed: ${message}`);
    }
  }
}

function assertMeetingOpenForInvites(status: VideoMeetingStatus): void {
  if (status === VideoMeetingStatus.ENDED || status === VideoMeetingStatus.CANCELLED) {
    throw new BadRequestException('Cannot manage invites for an ended or cancelled meeting');
  }
}

function serializeColleague(row: {
  id: string;
  employeeId: string | null;
  displayName: string;
  admissionStatus: VideoMeetingAdmissionStatus;
  createdAt: Date;
}): ColleagueInviteListItemDto {
  const admissionStatus =
    row.admissionStatus === VideoMeetingAdmissionStatus.ADMITTED
      ? 'ADMITTED'
      : row.admissionStatus === VideoMeetingAdmissionStatus.REJECTED
        ? 'REJECTED'
        : 'WAITING';
  return {
    participantId: row.id,
    employeeId: row.employeeId ?? '',
    displayName: row.displayName,
    admissionStatus,
    createdAt: row.createdAt.toISOString(),
  };
}
