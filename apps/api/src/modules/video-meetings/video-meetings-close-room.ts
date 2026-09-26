import { PrismaClient } from '@nbos/database';
import type { VideoMeetingsLivekitService } from './video-meetings-livekit.service';

/** Disconnect everyone still in the open session room. A missing room is ignored. */
export async function closeOpenMeetingRoom(
  prisma: InstanceType<typeof PrismaClient>,
  livekit: VideoMeetingsLivekitService,
  meetingId: string,
): Promise<void> {
  if (!livekit.isConfigured()) return;
  const open = await prisma.videoMeetingSession.findFirst({
    where: { meetingId, endedAt: null },
    select: { livekitRoomName: true },
  });
  if (!open) return;
  await livekit.closeRoom(open.livekitRoomName);
}
