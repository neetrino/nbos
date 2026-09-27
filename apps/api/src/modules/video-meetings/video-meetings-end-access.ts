import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaClient, VideoMeetingParticipantKind } from '@nbos/database';
import type { VideoMeetingsLivekitService } from './video-meetings-livekit.service';
import { admittedTeammateWhere } from './video-meetings-teammate-access';

type PrismaDb = InstanceType<typeof PrismaClient>;

export type MeetingEndAccess = {
  mayCancelCalendar: boolean;
};

const HOST_ONLY = 'Only host or owner may end this meeting';
const TEAMMATE_ONLY = 'Only a teammate in this meeting may end it';
const OTHERS_PRESENT = 'Other teammates are still in the call';

/**
 * The last teammate still connected ends the meeting.
 * A host may end it from the detail page when no other teammate is in the room.
 * Without LiveKit, only the host or owner can end, matching the previous rule.
 */
export async function authorizeMeetingEnd(
  prisma: PrismaDb,
  livekit: VideoMeetingsLivekitService,
  meetingId: string,
  employeeId: string,
): Promise<MeetingEndAccess> {
  const meeting = await prisma.videoMeeting.findUnique({ where: { id: meetingId } });
  if (!meeting) throw new NotFoundException('Meeting not found');
  const isHost = meeting.hostEmployeeId === employeeId || meeting.ownerEmployeeId === employeeId;
  if (!livekit.isConfigured()) return hostOnly(isHost);
  return authorizeConnectedEnd(prisma, livekit, meetingId, employeeId, isHost);
}

function hostOnly(isHost: boolean): MeetingEndAccess {
  if (!isHost) throw new ForbiddenException(HOST_ONLY);
  return { mayCancelCalendar: true };
}

async function authorizeConnectedEnd(
  prisma: PrismaDb,
  livekit: VideoMeetingsLivekitService,
  meetingId: string,
  employeeId: string,
  isHost: boolean,
): Promise<MeetingEndAccess> {
  const session = await prisma.videoMeetingSession.findFirst({
    where: { meetingId, endedAt: null },
    select: { id: true, livekitRoomName: true },
  });
  if (!session) return hostOnly(isHost);
  const identities = await livekit.listParticipantIdentities(session.livekitRoomName);
  await assertNoOtherTeammate(prisma, meetingId, employeeId, identities);
  const connected = await callerIsConnected(prisma, meetingId, session.id, employeeId, identities);
  if (!connected && !isHost) throw new ForbiddenException(TEAMMATE_ONLY);
  return { mayCancelCalendar: isHost };
}

async function assertNoOtherTeammate(
  prisma: PrismaDb,
  meetingId: string,
  employeeId: string,
  identities: string[],
): Promise<void> {
  if (identities.length === 0) return;
  const others = await prisma.videoMeetingParticipant.count({
    where: {
      id: { in: identities },
      meetingId,
      kind: VideoMeetingParticipantKind.EMPLOYEE,
      employeeId: { not: employeeId },
    },
  });
  if (others > 0) throw new BadRequestException(OTHERS_PRESENT);
}

async function callerIsConnected(
  prisma: PrismaDb,
  meetingId: string,
  sessionId: string,
  employeeId: string,
  identities: string[],
): Promise<boolean> {
  const participant = await prisma.videoMeetingParticipant.findFirst({
    where: admittedTeammateWhere(meetingId, employeeId, sessionId),
    select: { id: true },
  });
  return participant != null && identities.includes(participant.id);
}
