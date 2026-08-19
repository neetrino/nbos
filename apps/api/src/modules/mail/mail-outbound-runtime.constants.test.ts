import { describe, expect, it } from 'vitest';
import { MAIL_SEND_JOB_ID_PREFIX, mailSendJobId } from './mail-outbound-runtime.constants';

describe('mailSendJobId', () => {
  it('is stable per message and BullMQ-safe', () => {
    expect(mailSendJobId('msg-1')).toBe('mail-send-msg-1');
    expect(mailSendJobId('msg-1')).toBe(mailSendJobId('msg-1'));
    expect(mailSendJobId('msg-1')).not.toContain(':');
    expect(MAIL_SEND_JOB_ID_PREFIX).toBe('mail-send:');
  });
});
