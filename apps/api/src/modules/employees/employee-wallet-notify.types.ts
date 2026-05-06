import type { CreateNotificationParams } from '../notifications/notification.service';

/** Narrow sink so finance/bonus code does not depend on the full notification stack. */
export type WalletInAppNotifySink = {
  create(params: CreateNotificationParams): Promise<unknown>;
};
