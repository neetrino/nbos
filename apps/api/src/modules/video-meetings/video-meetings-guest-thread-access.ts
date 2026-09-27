import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaClient, VideoMeetingAdmissionStatus, VideoMeetingStatus } from '@nbos/database';
import type { VideoMeetingsInvitesService } from './video-meetings-invites.service';

type PrismaDb = InstanceType<typeof PrismaClient>;

export type AdmittedGuest = {
  meetingId: string;
  sessionId: string;
  participantId: string;
  displayName: string;
};

const NOT_ADMITTED = 'Guest is not admitted to a live session';

/**
 * Thread access for guests exists only while admitted to the open session of an ACTIVE room.
 * Outside that window the guest has no thread access at all.
 */
export async function requireAdmittedLiveGuest(
  prisma: PrismaDb,
  invites: Pick<VideoMeetingsInvitesService, 'findAdmissibleBySecret'>,
  inviteToken: string,
): Promise<AdmittedGuest> {
  const invite = await invites.findAdmissibleBySecret(inviteToken);
  if (!invite) throw new NotFoundException('Invite not found or not admissible');
  const participant = await prisma.videoMeetingParticipant.findUnique({
    where: { inviteId: invite.id },
  });
  if (!participant || participant.admissionStatus !== VideoMeetingAdmissionStatus.ADMITTED) {
    throw new ForbiddenException(NOT_ADMITTED);
  }
  const meeting = await prisma.videoMeeting.findUnique({
    where: { id: invite.meetingId },
    select: { status: true },
  });
  if (meeting?.status !== VideoMeetingStatus.ACTIVE) throw new ForbiddenException(NOT_ADMITTED);
  const open = await prisma.videoMeetingSession.findFirst({
    where: { meetingId: invite.meetingId, endedAt: null },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });
  if (!open || participant.sessionId !== open.id) throw new ForbiddenException(NOT_ADMITTED);
  return {
    meetingId: invite.meetingId,
    sessionId: open.id,
    participantId: participant.id,
    displayName: participant.displayName,
  };
}
