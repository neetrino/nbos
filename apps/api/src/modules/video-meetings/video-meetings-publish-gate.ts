import { VideoMeetingRecordingStatus } from '@nbos/database';

export type VideoMeetingPublishGate = {
  recordingActive: boolean;
  consentGranted: boolean;
};

type RecordingFindFirstArgs = {
  where: {
    meetingId: string;
    status: (typeof VideoMeetingRecordingStatus)['RECORDING'];
  };
  select: { status: true };
};

type RecordingFinder = {
  findFirst: (args: RecordingFindFirstArgs) => Promise<{ status: string } | null>;
};

type ConsentSource = {
  getLatestForParticipant: (
    participantId: string,
  ) => Promise<{ decision: string } | null | undefined>;
  isGranted: (decision: string | null | undefined) => boolean;
};

/**
 * While a recording group is RECORDING, publish requires GRANTED consent.
 * When no recording is active, callers keep normal publish grants.
 */
export async function loadVideoMeetingPublishGate(
  recordings: RecordingFinder,
  consent: ConsentSource,
  meetingId: string,
  participantId: string,
): Promise<VideoMeetingPublishGate> {
  const recording = await recordings.findFirst({
    where: { meetingId, status: VideoMeetingRecordingStatus.RECORDING },
    select: { status: true },
  });
  if (!recording) {
    return { recordingActive: false, consentGranted: false };
  }
  const latest = await consent.getLatestForParticipant(participantId);
  return {
    recordingActive: true,
    consentGranted: consent.isGranted(latest?.decision ?? null),
  };
}
