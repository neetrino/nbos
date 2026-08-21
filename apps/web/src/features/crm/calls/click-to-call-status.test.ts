import { describe, expect, it } from 'vitest';
import {
  canShowClickToCallButton,
  clickToCallButtonLabel,
  hasClickToCallPermission,
} from './click-to-call-status';

describe('click-to-call button', () => {
  it('is visible when the user can create a call and the sheet is active', () => {
    expect(canShowClickToCallButton({ hidden: false, canCreate: true })).toBe(true);
    expect(canShowClickToCallButton({ hidden: true, canCreate: true })).toBe(false);
    expect(canShowClickToCallButton({ hidden: false, canCreate: false })).toBe(false);
  });

  it('uses the idle, loading, success, and error labels', () => {
    expect(clickToCallButtonLabel('idle')).toBe('Позвонить');
    expect(clickToCallButtonLabel('loading')).toBe('Инициируем звонок...');
    expect(clickToCallButtonLabel('success')).toBe('Звонок начат');
    expect(clickToCallButtonLabel('error')).toBe('Ошибка запуска звонка');
  });

  it('maps CALL_CREATE to CRM EDIT on the parent', () => {
    const can = (action: string, module: string) =>
      action === 'EDIT' && (module === 'CRM_LEADS' || module === 'CRM_DEALS');
    expect(hasClickToCallPermission(can, 'LEAD')).toBe(true);
    expect(hasClickToCallPermission(() => false, 'CONTACT')).toBe(false);
  });
});
