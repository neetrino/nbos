import { describe, expect, it } from 'vitest';
import { redactAccessSlotCredential } from './product-access-slot-redact';

const CREDENTIAL = {
  id: 'cred-1',
  name: 'Beget company',
  category: 'HOSTING',
  credentialType: 'HOSTING_SERVER',
  login: 'admin@beget',
  url: 'https://beget.com',
};

describe('redactAccessSlotCredential', () => {
  it('keeps login and url when the caller can reveal', () => {
    expect(redactAccessSlotCredential(CREDENTIAL, true)).toEqual({
      ...CREDENTIAL,
      canReveal: true,
    });
  });

  it('strips login and url when the caller cannot reveal', () => {
    expect(redactAccessSlotCredential(CREDENTIAL, false)).toEqual({
      id: 'cred-1',
      name: 'Beget company',
      category: 'HOSTING',
      credentialType: 'HOSTING_SERVER',
      login: null,
      url: null,
      canReveal: false,
    });
  });
});
