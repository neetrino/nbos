import { describe, expect, it } from 'vitest';
import { MAIL_SEND_JOB_ID_PREFIX, mailSendJobId } from './mail-outbound-runtime.constants';

describe('mailSendJobId', () => {
  it('is stable per message', () => {
    expect(mailSendJobId('msg-1')).toBe(`${MAIL_SEND_JOB_ID_PREFIX}msg-1`);
    expect(mailSendJobId('msg-1')).toBe(mailSendJobId('msg-1'));
  });
});
