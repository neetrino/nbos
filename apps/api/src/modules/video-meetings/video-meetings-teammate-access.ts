import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  PrismaClient,
  VideoMeetingAdmissionStatus,
  VideoMeetingParticipantKind,
} from '@nbos/database';

type PrismaDb = InstanceType<typeof PrismaClient>;

const TEAMMATE_DENIED = 'Only a teammate in this meeting may do this';

/** Employee admitted to the open session. Guests, invitees, and past sessions are rejected. */
export async function requireMeetingTeammate(
  prisma: PrismaDb,
  meetingId: string,
  employeeId: string,
) {
  const meeting = await prisma.videoMeeting.findUnique({ where: { id: meetingId } });
  if (!meeting) throw new NotFoundException('Meeting not found');
  const session = await openLiveSession(prisma, meetingId);
  if (!session) throw new BadRequestException('Meeting is not live');
  const participant = await prisma.videoMeetingParticipant.findFirst({
    where: admittedTeammateWhere(meetingId, employeeId, session.id),
    select: { id: true },
  });
  if (!participant) throw new ForbiddenException(TEAMMATE_DENIED);
  return { meeting, participantId: participant.id, roomName: session.livekitRoomName };
}

/** The caller is in the LiveKit room right now. A stale participant row is not enough. */
export function assertTeammateConnected(
  participantId: string,
  identities: readonly string[],
): void {
  if (!identities.includes(participantId)) throw new ForbiddenException(TEAMMATE_DENIED);
}

export function admittedTeammateWhere(meetingId: string, employeeId: string, sessionId: string) {
  return {
    meetingId,
    employeeId,
    kind: VideoMeetingParticipantKind.EMPLOYEE,
    admissionStatus: VideoMeetingAdmissionStatus.ADMITTED,
    sessionId,
    leftAt: null as null,
  };
}

async function openLiveSession(prisma: PrismaDb, meetingId: string) {
  return prisma.videoMeetingSession.findFirst({
    where: { meetingId, endedAt: null },
    orderBy: { createdAt: 'desc' },
    select: { id: true, livekitRoomName: true },
  });
}
