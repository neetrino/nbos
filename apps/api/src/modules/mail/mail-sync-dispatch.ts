import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { MAIL_INLINE_FALLBACK_LOG } from './mail-outbound-runtime.constants';
import { isMailProductionRuntime } from './mail-outbound-dispatch';
import { MailQueueService } from './mail-queue.service';
import { MailSyncService } from './mail-sync.service';

/**
 * Manual sync: production enqueue miss → 503, never inline.
 * Local without Redis → inline + `mail.inline_fallback`.
 */
export async function dispatchManualMailSync(params: {
  queue: MailQueueService;
  syncService: MailSyncService;
  logger: Logger;
  mailAccountId: string;
}): Promise<boolean> {
  const queued = await params.queue.enqueueSync(params.mailAccountId);
  if (queued) {
    return true;
  }
  if (isMailProductionRuntime()) {
    throw new ServiceUnavailableException('Mail sync queue is unavailable');
  }
  params.logger.warn(`${MAIL_INLINE_FALLBACK_LOG} mailAccountId=${params.mailAccountId}`);
  await params.syncService.syncAccount(params.mailAccountId);
  return false;
}

/**
 * Pub/Sub, IDLE, connect, poll: enqueue only.
 * Production never inlines. Local may inline with `mail.inline_fallback`.
 * Returns whether the job was accepted by the queue.
 */
export async function enqueueMailSyncBestEffort(params: {
  queue: MailQueueService;
  syncService: MailSyncService;
  logger: Logger;
  mailAccountId: string;
  allowLocalInline?: boolean;
}): Promise<boolean> {
  const queued = await params.queue.enqueueSync(params.mailAccountId);
  if (queued) {
    return true;
  }
  if (isMailProductionRuntime() || params.allowLocalInline === false) {
    return false;
  }
  params.logger.warn(`${MAIL_INLINE_FALLBACK_LOG} mailAccountId=${params.mailAccountId}`);
  await params.syncService.syncAccount(params.mailAccountId);
  return false;
}
