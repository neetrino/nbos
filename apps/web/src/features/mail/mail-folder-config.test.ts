import { describe, expect, it } from 'vitest';
import {
  isMailAccountListedInDailySwitcher,
  mailAccountsForDailySwitcher,
  mailFolderListParams,
} from './mail-folder-config';

describe('mail daily switcher visibility', () => {
  it('hides DISABLED and keeps live plus the current selection', () => {
    expect(isMailAccountListedInDailySwitcher('ACTIVE')).toBe(true);
    expect(isMailAccountListedInDailySwitcher('NEEDS_RECONNECT')).toBe(true);
    expect(isMailAccountListedInDailySwitcher('DISABLED')).toBe(false);

    const accounts = [
      { id: 'live', status: 'ACTIVE' },
      { id: 'off', status: 'DISABLED' },
      { id: 'selected-off', status: 'DISABLED' },
    ];
    expect(mailAccountsForDailySwitcher(accounts, null).map((row) => row.id)).toEqual(['live']);
    expect(mailAccountsForDailySwitcher(accounts, 'selected-off').map((row) => row.id)).toEqual([
      'live',
      'selected-off',
    ]);
  });
});

describe('mailFolderListParams', () => {
  it('maps Drafts to draftsOnly', () => {
    expect(mailFolderListParams('drafts')).toEqual({ draftsOnly: true });
  });
});
