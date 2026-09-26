import { notFound } from 'next/navigation';
import { isVideoMeetingsWebFeatureEnabled } from './feature-flag';

/** Server-only gate: feature off behaves like an unknown route (404). */
export function ensureVideoMeetingsWebEnabled(): void {
  if (!isVideoMeetingsWebFeatureEnabled()) {
    notFound();
  }
}
