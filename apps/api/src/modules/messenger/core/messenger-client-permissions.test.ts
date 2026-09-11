import { describe, expect, it } from 'vitest';
import {
  MESSENGER_CLIENT_CAPABILITY_ALL_ROLE_IDS,
  MESSENGER_CLIENT_CAPABILITY_OWN_ROLE_IDS,
  MESSENGER_CLIENT_READ_ACTION,
  MESSENGER_CLIENT_READ_PERMISSION,
  MESSENGER_CLIENT_READ_PERMISSION_ID,
  MESSENGER_CLIENT_SEND_ACTION,
  MESSENGER_CLIENT_SEND_PERMISSION,
  MESSENGER_MODULE,
} from '@nbos/shared';

describe('MESSENGER CLIENT_READ / CLIENT_SEND catalog', () => {
  it('uses module_action keys on MESSENGER', () => {
    expect(MESSENGER_CLIENT_READ_PERMISSION).toBe('MESSENGER_CLIENT_READ');
    expect(MESSENGER_CLIENT_SEND_PERMISSION).toBe('MESSENGER_CLIENT_SEND');
    expect(`${MESSENGER_MODULE}_${MESSENGER_CLIENT_READ_ACTION}`).toBe(
      MESSENGER_CLIENT_READ_PERMISSION,
    );
    expect(MESSENGER_CLIENT_READ_PERMISSION_ID).toBe('perm-messenger-client-read');
  });

  it('does not seed Client capabilities onto developer roles', () => {
    const seeded = [
      ...MESSENGER_CLIENT_CAPABILITY_ALL_ROLE_IDS,
      ...MESSENGER_CLIENT_CAPABILITY_OWN_ROLE_IDS,
    ];
    expect(seeded).not.toContain('role-developer');
    expect(seeded).not.toContain('role-developer-frontend');
    expect(seeded).not.toContain('role-junior-developer');
    expect(MESSENGER_CLIENT_SEND_ACTION).toBe('CLIENT_SEND');
  });
});
