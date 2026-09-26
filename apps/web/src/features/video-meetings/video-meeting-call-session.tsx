'use client';

import { Component, createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { VideoMeetingCallDock } from './VideoMeetingCallDock';

type VideoMeetingCallContextValue = {
  open: (meetingId: string) => void;
};

const VideoMeetingCallContext = createContext<VideoMeetingCallContextValue | null>(null);

export function useVideoMeetingCall(): VideoMeetingCallContextValue {
  const value = useContext(VideoMeetingCallContext);
  if (!value) {
    throw new Error('useVideoMeetingCall must be used within VideoMeetingCallProvider');
  }
  return value;
}

/** Keeps the live call mounted above route changes so minimize does not disconnect. */
export function VideoMeetingCallProvider({ children }: { children: ReactNode }) {
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const open = useCallback((id: string) => {
    setMeetingId(id);
    setExpanded(true);
  }, []);
  const dismiss = useCallback(() => setMeetingId(null), []);

  return (
    <VideoMeetingCallContext.Provider value={{ open }}>
      {children}
      {meetingId ? (
        <VideoMeetingCallBoundary onDismiss={dismiss}>
          <VideoMeetingCallDock
            key={meetingId}
            meetingId={meetingId}
            expanded={expanded}
            onMinimize={() => setExpanded(false)}
            onExpand={() => setExpanded(true)}
            onDismiss={dismiss}
          />
        </VideoMeetingCallBoundary>
      ) : null}
    </VideoMeetingCallContext.Provider>
  );
}

class VideoMeetingCallBoundary extends Component<
  { onDismiss: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  componentDidCatch(): void {
    this.props.onDismiss();
  }

  render(): ReactNode {
    if (this.state.failed) return null;
    return this.props.children;
  }
}
