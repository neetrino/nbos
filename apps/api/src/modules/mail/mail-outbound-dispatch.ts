import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { MAIL_INLINE_FALLBACK_LOG } from './mail-outbound-runtime.constants';
import { MailQueueService } from './mail-queue.service';
import { MailSendService } from './mail-send.service';

export function isMailProductionRuntime(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.NODE_ENV === 'production';
}

/**
 * Enters the send contour after the row is already QUEUED.
 * Production enqueue miss → 503, row stays QUEUED.
 * Local without Redis → inline send + `mail.inline_fallback`.
 */
export async function dispatchQueuedOutboundSend(params: {
  queue: MailQueueService;
  sendService: MailSendService;
  logger: Logger;
  mailAccountId: string;
  messageId: string;
  actorEmployeeId: string;
}): Promise<void> {
  const enqueued = await params.queue.enqueueSend({
    mailAccountId: params.mailAccountId,
    messageId: params.messageId,
    actorEmployeeId: params.actorEmployeeId,
  });
  if (enqueued) {
    return;
  }
  if (isMailProductionRuntime()) {
    throw new ServiceUnavailableException('Mail send queue is unavailable');
  }
  params.logger.warn(`${MAIL_INLINE_FALLBACK_LOG} messageId=${params.messageId}`);
  await params.sendService.sendQueuedMessage(
    params.mailAccountId,
    params.messageId,
    params.actorEmployeeId,
  );
}
