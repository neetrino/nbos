import { PrismaClient, VideoMeetingStatus } from '@nbos/database';

type RecordingStop = {
  stopIfRecordingOnMeetingEnd(meetingId: string): Promise<void>;
};

/**
 * LiveKit closed the room (host end, empty timeout, or delete).
 * Ends the open NBOS session and finalizes a recording still in progress.
 * Idempotent when the host already ended the meeting.
 */
export async function closeMeetingAfterLiveKitRoomFinished(
  prisma: InstanceType<typeof PrismaClient>,
  recordings: RecordingStop,
  roomName: string,
): Promise<boolean> {
  const session = await prisma.videoMeetingSession.findFirst({
    where: { livekitRoomName: roomName, endedAt: null },
    select: { meetingId: true },
  });
  if (!session) return false;

  const meeting = await prisma.videoMeeting.findUnique({
    where: { id: session.meetingId },
    select: { status: true },
  });
  if (!meeting || meeting.status !== VideoMeetingStatus.ACTIVE) return false;

  await recordings.stopIfRecordingOnMeetingEnd(session.meetingId);
  const now = new Date();
  return prisma.$transaction(async (tx) => {
    const updated = await tx.videoMeeting.updateMany({
      where: { id: session.meetingId, status: VideoMeetingStatus.ACTIVE },
      data: { status: VideoMeetingStatus.IDLE, endedAt: now },
    });
    if (updated.count === 0) return false;
    await tx.videoMeetingSession.updateMany({
      where: { meetingId: session.meetingId, endedAt: null },
      data: { endedAt: now },
    });
    return true;
  });
}
