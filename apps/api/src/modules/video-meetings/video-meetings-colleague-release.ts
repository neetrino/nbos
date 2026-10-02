import { Logger } from '@nestjs/common';
import {
  PrismaClient,
  VideoMeetingAdmissionStatus,
  VideoMeetingParticipantKind,
  VideoMeetingStatus,
} from '@nbos/database';
import type { CurrentUserPayload } from '../../common/decorators';
import type { NotificationService } from '../notifications/notification.service';
import { buildEmployeeDisplayName } from './video-meetings-guest-safety';
import { VIDEO_MEETING_COLLEAGUE_INVITE_NOTIFICATION_TYPE } from './video-meetings.constants';

const logger = new Logger('VideoMeetingsColleagueRelease');

type NotifyColleagueParams = {
  recipientId: string;
  meetingId: string;
  meetingTitle: string;
  inviterName: string;
};

/** In-app Accept/Decline notice. Failures are logged and do not roll back the roster. */
export async function notifyColleagueInvite(
  notifications: NotificationService,
  params: NotifyColleagueParams,
): Promise<void> {
  try {
    await notifications.create({
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
    logger.warn(`Colleague invite notification failed: ${message}`);
  }
}

/** Send popup invites for colleagues already on the roster once the meeting is live. */
export async function releaseWaitingColleagueInvites(
  prisma: InstanceType<typeof PrismaClient>,
  notifications: NotificationService,
  user: CurrentUserPayload,
  meetingId: string,
): Promise<void> {
  const meeting = await prisma.videoMeeting.findUnique({
    where: { id: meetingId },
    select: { title: true, status: true },
  });
  if (meeting?.status !== VideoMeetingStatus.ACTIVE) return;
  const waiting = await prisma.videoMeetingParticipant.findMany({
    where: {
      meetingId,
      kind: VideoMeetingParticipantKind.EMPLOYEE,
      admissionStatus: VideoMeetingAdmissionStatus.WAITING,
      employeeId: { not: null },
    },
    select: { employeeId: true },
  });
  const inviterName = buildEmployeeDisplayName(user);
  for (const row of waiting) {
    if (!row.employeeId) continue;
    await notifyColleagueInvite(notifications, {
      recipientId: row.employeeId,
      meetingId,
      meetingTitle: meeting.title,
      inviterName,
    });
  }
}
