import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  PrismaClient,
  VideoMeetingAdmissionStatus,
  VideoMeetingParticipantKind,
  type Prisma,
} from '@nbos/database';

type PrismaDb = InstanceType<typeof PrismaClient>;
type VideoMeetingSessionRow = Prisma.VideoMeetingSessionGetPayload<object>;

export async function ensureEmployeeParticipant(
  prisma: PrismaDb,
  meetingId: string,
  sessionId: string,
  employeeId: string,
  displayName: string,
  existing: { id: string; admissionStatus: VideoMeetingAdmissionStatus } | null,
) {
  if (!existing) {
    return prisma.videoMeetingParticipant.create({
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
  await prisma.videoMeetingParticipant.update({
    where: { id: existing.id },
    data: { sessionId, displayName, leftAt: null },
  });
  return existing;
}

export async function requireGuestParticipant(
  prisma: PrismaDb,
  meetingId: string,
  participantId: string,
) {
  const participant = await prisma.videoMeetingParticipant.findFirst({
    where: { id: participantId, meetingId, kind: VideoMeetingParticipantKind.GUEST },
  });
  if (!participant) throw new NotFoundException('Participant not found');
  return participant;
}

export async function requireHostOrOwner(prisma: PrismaDb, meetingId: string, employeeId: string) {
  const meeting = await prisma.videoMeeting.findUnique({ where: { id: meetingId } });
  if (!meeting) throw new NotFoundException('Meeting not found');
  if (meeting.hostEmployeeId !== employeeId && meeting.ownerEmployeeId !== employeeId) {
    throw new ForbiddenException('Only host or owner may manage admission');
  }
  return meeting;
}

export async function requireActiveSession(
  prisma: PrismaDb,
  meetingId: string,
): Promise<VideoMeetingSessionRow> {
  const session = await prisma.videoMeetingSession.findFirst({
    where: { meetingId, endedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  if (!session) throw new BadRequestException('Meeting has no active session');
  return session;
}
