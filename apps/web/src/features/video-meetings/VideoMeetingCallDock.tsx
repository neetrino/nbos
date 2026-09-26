'use client';

import { useCallback, useEffect, useRef, type MutableRefObject } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { videoMeetingsApi } from '@/lib/api/video-meetings';
import { usePermission } from '@/lib/permissions';
import { VideoMeetingLiveKitRoom } from './VideoMeetingLiveKitRoom';
import { VideoMeetingCallStatus } from './VideoMeetingCallStatus';
import { useVideoMeetingRoomConnect } from './use-video-meeting-room-connect';
import { EXPANDED_CALL_SHELL_CLASS, MINIMIZED_CALL_SHELL_CLASS } from './video-meeting-call-styles';

type VideoMeetingCallDockProps = {
  meetingId: string;
  expanded: boolean;
  onMinimize: () => void;
  onExpand: () => void;
  onDismiss: () => void;
};

/** Persistent call window. Collapsing hides the stage and keeps the room connected. */
export function VideoMeetingCallDock(props: VideoMeetingCallDockProps) {
  const dock = useVideoMeetingCallDock(props);
  const shellClass = props.expanded ? EXPANDED_CALL_SHELL_CLASS : MINIMIZED_CALL_SHELL_CLASS;

  if (dock.phase !== 'ready' || !dock.credentials) {
    return (
      <VideoMeetingCallStatus
        expanded={props.expanded}
        shellClass={shellClass}
        phase={dock.phase}
        message={dock.statusText}
        onRetry={() => void dock.connect()}
        onDismiss={dock.finish}
        onExpand={props.onExpand}
      />
    );
  }

  return (
    <div className={shellClass}>
      <VideoMeetingLiveKitRoom
        credentials={dock.credentials}
        title={dock.card?.title}
        meetingId={props.meetingId}
        canEnd={dock.canManage}
        canControlRecording={dock.canManage}
        isHost={dock.isHost}
        framed={false}
        minimized={!props.expanded}
        onMinimize={dock.minimize}
        onExpand={props.onExpand}
        onLeave={dock.finish}
        onEnd={dock.endMeeting}
        onConnected={dock.markConnected}
        onDisconnected={dock.handleDisconnected}
      />
    </div>
  );
}

function useVideoMeetingCallDock({ meetingId, onMinimize, onDismiss }: VideoMeetingCallDockProps) {
  const t = useTranslations('videoMeetings');
  const router = useRouter();
  const pathname = usePathname();
  const leavingRef = useRef(false);
  const reconnectingRef = useRef(false);
  const { me, can } = usePermission();
  const { phase, card, credentials, errorMessage, connect } = useVideoMeetingRoomConnect(
    meetingId,
    t('room.tokenError'),
  );
  const leaveRoomRoute = useLeaveRoomRoute(meetingId, pathname, router);
  const exit = useCallExit(meetingId, leavingRef, onMinimize, onDismiss, leaveRoomRoute);
  const markConnected = useCallback(() => {
    reconnectingRef.current = false;
  }, []);
  const handleDisconnected = useDropHandler(
    leavingRef,
    reconnectingRef,
    connect,
    onDismiss,
    leaveRoomRoute,
  );
  useConnectLifecycle(connect, phase, leavingRef, onDismiss);

  const isHost = Boolean(
    me && card && (me.id === card.hostEmployeeId || me.id === card.ownerEmployeeId),
  );

  return {
    phase,
    card,
    credentials,
    connect,
    isHost,
    canManage: isHost && can('EDIT', 'VIDEO_MEETINGS'),
    ...exit,
    markConnected,
    handleDisconnected,
    statusText: callStatusText(phase, errorMessage, {
      connecting: t('room.connecting'),
      ended: t('room.callEnded'),
      unavailable: t('room.livekitUnavailable'),
    }),
  };
}

function useConnectLifecycle(
  connect: () => Promise<void>,
  phase: string,
  leavingRef: MutableRefObject<boolean>,
  onDismiss: () => void,
) {
  useEffect(() => {
    void connect();
  }, [connect]);

  useEffect(() => {
    if (phase === 'inactive' && leavingRef.current) onDismiss();
  }, [leavingRef, onDismiss, phase]);
}

function useDropHandler(
  leavingRef: MutableRefObject<boolean>,
  reconnectingRef: MutableRefObject<boolean>,
  connect: () => Promise<void>,
  onDismiss: () => void,
  leaveRoomRoute: () => void,
) {
  return useCallback(() => {
    if (leavingRef.current) {
      onDismiss();
      leaveRoomRoute();
      return;
    }
    if (reconnectingRef.current) return;
    reconnectingRef.current = true;
    void connect();
  }, [connect, leaveRoomRoute, leavingRef, onDismiss, reconnectingRef]);
}

function useLeaveRoomRoute(
  meetingId: string,
  pathname: string,
  router: ReturnType<typeof useRouter>,
) {
  return useCallback(() => {
    if (pathname.includes(`/video-meetings/${meetingId}/room`)) {
      router.push(`/video-meetings/${meetingId}`);
    }
  }, [meetingId, pathname, router]);
}

function useCallExit(
  meetingId: string,
  leavingRef: MutableRefObject<boolean>,
  onMinimize: () => void,
  onDismiss: () => void,
  leaveRoomRoute: () => void,
) {
  const finish = useCallback(() => {
    leavingRef.current = true;
    onDismiss();
    leaveRoomRoute();
  }, [leaveRoomRoute, leavingRef, onDismiss]);

  const minimize = useCallback(() => {
    onMinimize();
    leaveRoomRoute();
  }, [leaveRoomRoute, onMinimize]);

  const endMeeting = useCallback(async () => {
    leavingRef.current = true;
    try {
      await videoMeetingsApi.end(meetingId);
    } catch (error) {
      leavingRef.current = false;
      throw error;
    }
  }, [leavingRef, meetingId]);

  return { finish, minimize, endMeeting };
}

function callStatusText(
  phase: string,
  errorMessage: string,
  labels: { connecting: string; ended: string; unavailable: string },
): string {
  if (phase === 'inactive') return labels.ended;
  if (phase === 'loading') return labels.connecting;
  if (phase === 'unavailable') return errorMessage || labels.unavailable;
  return errorMessage || labels.connecting;
}
