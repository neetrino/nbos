import type { NavModuleDefinition } from './nav-config';
import { isVideoMeetingsWebFeatureEnabled } from '@/lib/video-meetings/feature-flag';

/** Removes modules gated by feature flags (default OFF until env enables them). */
export function applyNavFeatureFlags(definitions: NavModuleDefinition[]): NavModuleDefinition[] {
  if (isVideoMeetingsWebFeatureEnabled()) {
    return definitions;
  }
  return definitions.filter((item) => item.key !== 'video-meetings');
}
