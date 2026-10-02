import { Logger } from '@nestjs/common';

import type { CreateNotificationParams } from '../notifications/notification.service';
import type { WalletInAppNotifySink } from './employee-wallet-notify.types';

const log = new Logger('WalletNotifyBuffer');

/**
 * Holds wallet notifications until the surrounding database transaction commits.
 * A rolled-back payment must not tell the employee that a bonus was paid.
 */
export function bufferWalletNotifications(): {
  sink: WalletInAppNotifySink;
  flush: (target: WalletInAppNotifySink | undefined) => Promise<void>;
} {
  const queued: CreateNotificationParams[] = [];
  return {
    sink: {
      create: (params) => {
        queued.push(params);
        return Promise.resolve(undefined);
      },
    },
    flush: (target) => flushQueuedNotifications(target, queued),
  };
}

async function flushQueuedNotifications(
  target: WalletInAppNotifySink | undefined,
  queued: CreateNotificationParams[],
): Promise<void> {
  if (target == null) return;
  for (const params of queued) {
    try {
      await target.create(params);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.warn(`wallet_notify_failed: ${message}`);
    }
  }
}
