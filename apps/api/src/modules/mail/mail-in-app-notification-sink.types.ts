import type { CreateNotificationParams } from '../notifications/notification.service';

/** Narrow interface for mail ops that publish in-app notifications (avoids coupling to full NotificationService). */
export type MailInAppNotificationSink = {
  create: (params: CreateNotificationParams) => Promise<unknown>;
};
