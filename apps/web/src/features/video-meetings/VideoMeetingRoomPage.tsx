'use client';

import { useEffect } from 'react';
import { useVideoMeetingCall } from './video-meeting-call-session';

type VideoMeetingRoomPageProps = {
  meetingId: string;
};

/** Opens the persistent call sheet. The room stays connected after this page unmounts. */
export function VideoMeetingRoomPage({ meetingId }: VideoMeetingRoomPageProps) {
  const { open } = useVideoMeetingCall();

  useEffect(() => {
    open(meetingId);
  }, [meetingId, open]);

  return null;
}
