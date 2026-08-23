import type { ClickToCallTargetType } from '@/lib/api/calls';

export type ClickToCallUiState = 'idle' | 'loading' | 'success' | 'error';
export type { ClickToCallTargetType };

export function clickToCallButtonLabel(state: ClickToCallUiState): string {
  if (state === 'loading') return 'Инициируем звонок...';
  if (state === 'success') return 'Звонок начат';
  if (state === 'error') return 'Ошибка запуска звонка';
  return 'Позвонить';
}

export const CLICK_TO_CALL_NEW_CALL_LABEL = 'Новый звонок';

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
