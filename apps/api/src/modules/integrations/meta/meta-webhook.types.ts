import type { Request } from 'express';

/** Express request with raw body captured during JSON parsing for Meta webhook HMAC. */
export type MetaWebhookRequest = Request & {
  rawBody?: Buffer;
};
