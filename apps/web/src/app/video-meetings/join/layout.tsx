import type { ReactNode } from 'react';
import { ensureVideoMeetingsWebEnabled } from '@/lib/video-meetings/ensure-web-enabled';

/** Guest join surface — no authenticated app shell or sidebar. */
export default function GuestVideoMeetingLayout({ children }: { children: ReactNode }) {
  ensureVideoMeetingsWebEnabled();
  return children;
}
