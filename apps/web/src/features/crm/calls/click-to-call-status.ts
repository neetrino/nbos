import type { ClickToCallTargetType } from '@/lib/api/calls';

export type ClickToCallUiState = 'idle' | 'loading' | 'success' | 'error';
export type { ClickToCallTargetType };

export type ClickToCallButtonVariant = 'default' | 'success' | 'destructive';

export const CLICK_TO_CALL_NEW_CALL_LABEL = 'New call';
export const CLICK_TO_CALL_ERROR_LABEL = 'Could not start call';

export function clickToCallButtonLabel(state: ClickToCallUiState): string {
  if (state === 'loading') return 'Calling...';
  if (state === 'success') return 'Call started';
  if (state === 'error') return CLICK_TO_CALL_ERROR_LABEL;
  return 'Call';
}

export function clickToCallButtonVariant(state: ClickToCallUiState): ClickToCallButtonVariant {
  if (state === 'error') return 'destructive';
  if (state === 'success') return 'success';
  return 'default';
}

export function hasClickToCallPermission(
  can: (action: string, module: string) => boolean,
  targetType: ClickToCallTargetType,
): boolean {
  if (targetType === 'LEAD') return can('EDIT', 'CRM_LEADS');
  if (targetType === 'DEAL') return can('EDIT', 'CRM_DEALS');
  return can('EDIT', 'CRM_LEADS') || can('EDIT', 'CRM_DEALS');
}

export function canShowClickToCallButton(params: { hidden: boolean; canCreate: boolean }): boolean {
  return !params.hidden && params.canCreate;
}
