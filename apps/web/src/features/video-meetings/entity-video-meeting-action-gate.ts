import { isVideoMeetingsFeatureEnabled } from '@nbos/shared';

/** Pure gate for cross-module card "Video meeting" actions (S07). */
export function canShowEntityVideoMeetingAction(input: {
  featureFlagEnv: string | undefined;
  canAdd: boolean;
  canEdit: boolean;
}): boolean {
  if (!isVideoMeetingsFeatureEnabled(input.featureFlagEnv)) return false;
  return input.canAdd || input.canEdit;
}
