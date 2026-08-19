import { describe, expect, it } from 'vitest';
import {
  MAIL_ATTACHMENT_JOB_ID_PREFIX,
  mailAttachmentJobId,
} from './mail-attachment-runtime.constants';

describe('mailAttachmentJobId', () => {
  it('uses a BullMQ-safe mail-att-{attachmentId}', () => {
    expect(mailAttachmentJobId('att-1')).toBe('mail-att-att-1');
    expect(mailAttachmentJobId('att-1')).not.toContain(':');
    expect(MAIL_ATTACHMENT_JOB_ID_PREFIX).toBe('mail-att:');
  });
});
