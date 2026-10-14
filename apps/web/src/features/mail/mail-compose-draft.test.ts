import { describe, expect, it } from 'vitest';
import { isMailComposeDraftWorthSaving, mailComposeDraftPayload } from './mail-compose-draft';

describe('mailComposeDraftPayload', () => {
  it('splits recipients and keeps HTML when present', () => {
    expect(
      mailComposeDraftPayload({
        to: 'a@x.com, b@x.com',
        cc: '',
        subject: ' Hello ',
        bodyText: 'Hi',
        bodyHtml: '<p>Hi</p>',
        fileAssetIds: ['file-1'],
      }),
    ).toEqual({
      to: ['a@x.com', 'b@x.com'],
      subject: 'Hello',
      bodyText: 'Hi',
      bodyHtml: '<p>Hi</p>',
      fileAssetIds: ['file-1'],
    });
  });
});

describe('isMailComposeDraftWorthSaving', () => {
  it('skips a completely empty compose', () => {
    expect(isMailComposeDraftWorthSaving({ to: [], subject: '', bodyText: '' })).toBe(false);
  });

  it('saves when the user has started writing', () => {
    expect(isMailComposeDraftWorthSaving({ to: [], subject: 'Hi', bodyText: '' })).toBe(true);
  });

  it('saves when only a file is attached', () => {
    expect(
      isMailComposeDraftWorthSaving({
        to: [],
        subject: '',
        bodyText: '',
        fileAssetIds: ['file-1'],
      }),
    ).toBe(true);
  });
});
