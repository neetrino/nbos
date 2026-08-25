import { describe, expect, it } from 'vitest';
import {
  canShowClickToCallButton,
  CLICK_TO_CALL_NEW_CALL_LABEL,
  clickToCallButtonLabel,
  clickToCallButtonVariant,
  hasClickToCallPermission,
} from './click-to-call-status';

describe('click-to-call button', () => {
  it('is visible when the user can create a call and the sheet is active', () => {
    expect(canShowClickToCallButton({ hidden: false, canCreate: true })).toBe(true);
    expect(canShowClickToCallButton({ hidden: true, canCreate: true })).toBe(false);
    expect(canShowClickToCallButton({ hidden: false, canCreate: false })).toBe(false);
  });

  it('uses the idle, loading, success, and error labels', () => {
    expect(clickToCallButtonLabel('idle')).toBe('Call');
    expect(clickToCallButtonLabel('loading')).toBe('Calling...');
    expect(clickToCallButtonLabel('success')).toBe('Call started');
    expect(clickToCallButtonLabel('error')).toBe('Could not start call');
    expect(CLICK_TO_CALL_NEW_CALL_LABEL).toBe('New call');
  });

  it('uses filled color variants so the action stays visible', () => {
    expect(clickToCallButtonVariant('idle')).toBe('default');
    expect(clickToCallButtonVariant('loading')).toBe('default');
    expect(clickToCallButtonVariant('success')).toBe('success');
    expect(clickToCallButtonVariant('error')).toBe('destructive');
  });

  it('maps CALL_CREATE to CRM EDIT on the parent', () => {
    const can = (action: string, module: string) =>
      action === 'EDIT' && (module === 'CRM_LEADS' || module === 'CRM_DEALS');
    expect(hasClickToCallPermission(can, 'LEAD')).toBe(true);
    expect(hasClickToCallPermission(() => false, 'CONTACT')).toBe(false);
  });
});
