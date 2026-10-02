import { z } from 'zod';
import {
  MESSENGER_OUTBOX_CONTENT_MAX,
  MESSENGER_OUTBOX_MENTION_MAX,
  MESSENGER_PERSIST_ENTITY_ID_PATTERN,
  MESSENGER_PERSIST_ISO_DATE_MAX_CHARS,
  MESSENGER_PERSIST_OUTBOX_MAX,
  MESSENGER_PERSIST_TITLE_MAX_CHARS,
} from './messenger-persist.constants';
import { parsePlainStrict } from './messenger-persist-dto';

const entityId = z.string().regex(MESSENGER_PERSIST_ENTITY_ID_PATTERN);
const isoDate = z
  .string()
  .min(20)
  .max(MESSENGER_PERSIST_ISO_DATE_MAX_CHARS)
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/);

export type MessengerPersistOutboxReplay = 'internal' | 'withhold';

export type MessengerPersistOutboxEntry = {
  idempotencyKey: string;
  conversationId: string;
  zone: 'INTERNAL' | 'CLIENT';
  content: string;
  senderId: string | null;
  senderName: string;
  createdAt: string;
  replay: MessengerPersistOutboxReplay;
  replyToMessageId?: string;
  mentionedEmployeeIds?: string[];
};

const entrySchema = z
  .object({
    idempotencyKey: entityId,
    conversationId: entityId,
    zone: z.enum(['INTERNAL', 'CLIENT']),
    content: z.string().min(1).max(MESSENGER_OUTBOX_CONTENT_MAX),
    senderId: entityId.nullable(),
    senderName: z.string().min(1).max(MESSENGER_PERSIST_TITLE_MAX_CHARS),
    createdAt: isoDate,
    replay: z.enum(['internal', 'withhold']),
    replyToMessageId: entityId.optional(),
    mentionedEmployeeIds: z.array(entityId).max(MESSENGER_OUTBOX_MENTION_MAX).optional(),
  })
  .strict();

/** Missing outbox is an empty list. A malformed item rejects the whole list. */
export function parseMessengerPersistOutbox(value: unknown): MessengerPersistOutboxEntry[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MESSENGER_PERSIST_OUTBOX_MAX) return null;
  const entries: MessengerPersistOutboxEntry[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    const parsed = parseOutboxEntry(item, seen);
    if (!parsed) return null;
    entries.push(parsed);
  }
  return entries;
}

function parseOutboxEntry(item: unknown, seen: Set<string>): MessengerPersistOutboxEntry | null {
  const parsed = parsePlainStrict(entrySchema, item);
  if (!parsed) return null;
  if (parsed.zone === 'CLIENT' && parsed.replay !== 'withhold') return null;
  if (seen.has(parsed.idempotencyKey)) return null;
  seen.add(parsed.idempotencyKey);
  return parsed;
}
