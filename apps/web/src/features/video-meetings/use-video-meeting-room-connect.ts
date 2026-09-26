'use client';

import { useCallback, useState } from 'react';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  videoMeetingsApi,
  type LiveKitJoinCredentials,
  type VideoMeetingCard,
} from '@/lib/api/video-meetings';

export type RoomConnectPhase = 'loading' | 'error' | 'ready' | 'unavailable' | 'inactive';

type RoomConnectState = {
  phase: RoomConnectPhase;
  card: VideoMeetingCard | null;
  credentials: LiveKitJoinCredentials | null;
  errorMessage: string;
};

const initialState: RoomConnectState = {
  phase: 'loading',
  card: null,
  credentials: null,
  errorMessage: '',
};

export function useVideoMeetingRoomConnect(meetingId: string, tokenErrorLabel: string) {
  const [state, setState] = useState<RoomConnectState>(initialState);

  const connect = useCallback(async () => {
    setState((current) => ({ ...current, phase: 'loading', errorMessage: '' }));
    try {
      const meeting = await videoMeetingsApi.getCard(meetingId);
      if (meeting.status !== 'ACTIVE') {
        setState({ ...initialState, phase: 'inactive', card: meeting });
        return;
      }
      const session = meeting.sessions.find((row) => !row.endedAt);
      const token = await videoMeetingsApi.employeeToken(meetingId, session?.livekitRoomName);
      setState({
        phase: 'ready',
        card: meeting,
        credentials: token,
        errorMessage: '',
      });
    } catch (caught) {
      const message = getApiErrorMessage(caught, tokenErrorLabel);
      if (message.toLowerCase().includes('livekit')) {
        setState({ ...initialState, phase: 'unavailable', errorMessage: message });
        return;
      }
      setState({ ...initialState, phase: 'error', errorMessage: message });
    }
  }, [meetingId, tokenErrorLabel]);

  return { ...state, connect };
}
