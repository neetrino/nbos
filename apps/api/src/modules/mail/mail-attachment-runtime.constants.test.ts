import { describe, expect, it } from 'vitest';
import {
  MAIL_ATTACHMENT_JOB_ID_PREFIX,
  mailAttachmentJobId,
} from './mail-attachment-runtime.constants';

describe('mailAttachmentJobId', () => {
  it('uses mail-att:{attachmentId}', () => {
    expect(mailAttachmentJobId('att-1')).toBe(`${MAIL_ATTACHMENT_JOB_ID_PREFIX}att-1`);
  });
});
