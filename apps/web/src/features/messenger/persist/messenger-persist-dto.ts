import { z } from 'zod';
import {
  MESSENGER_PERSIST_ATTENTION_PER_ROW_MAX,
  MESSENGER_PERSIST_COLLECTION_LIST_MAX,
  MESSENGER_PERSIST_CURSOR_MAX_CHARS,
  MESSENGER_PERSIST_ENTITY_ID_PATTERN,
  MESSENGER_PERSIST_ISO_DATE_MAX_CHARS,
  MESSENGER_PERSIST_PREVIEW_MAX_CHARS,
  MESSENGER_PERSIST_ROWS_PER_QUERY_MAX,
  MESSENGER_PERSIST_STATUS_MAX_CHARS,
  MESSENGER_PERSIST_TITLE_MAX_CHARS,
} from './messenger-persist.constants';
import { isPlainRecord } from './messenger-persist-plain';

const entityId = z.string().regex(MESSENGER_PERSIST_ENTITY_ID_PATTERN);
const isoDate = z
  .string()
  .min(20)
  .max(MESSENGER_PERSIST_ISO_DATE_MAX_CHARS)
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/);
const conversationType = z.enum([
  'PROJECT_GENERAL',
  'PRODUCT',
  'DEAL',
  'TASK',
  'WORKSPACE',
  'DIRECT',
  'INTERNAL_GROUP',
  'EXTERNAL',
]);

const attentionSchema = z
  .object({
    conversationId: entityId,
    productId: entityId,
    purpose: z.enum(['WORK', 'FINANCE']),
    productName: z.string().max(MESSENGER_PERSIST_TITLE_MAX_CHARS),
    ownerKind: z.enum(['EMPLOYEE', 'QUEUE', 'ROLE']),
    ownerEmployeeId: entityId.nullable(),
    ownerQueue: z.enum(['SUPPORT_INTAKE', 'FINANCE']).nullable(),
    ownerRole: z.literal('PRODUCT_PM').nullable(),
    isManual: z.boolean(),
    label: z.string().max(MESSENGER_PERSIST_TITLE_MAX_CHARS),
  })
  .strict();

const internalItemSchema = z
  .object({
    id: entityId,
    zone: z.literal('INTERNAL'),
    type: conversationType,
    title: z.string().max(MESSENGER_PERSIST_TITLE_MAX_CHARS).nullable(),
    status: z.string().min(1).max(MESSENGER_PERSIST_STATUS_MAX_CHARS),
    canonicalKey: z.string().max(MESSENGER_PERSIST_TITLE_MAX_CHARS).nullable(),
    createdAt: isoDate,
    lastMessageAt: isoDate.nullable(),
    lastMessagePreview: z.string().max(MESSENGER_PERSIST_PREVIEW_MAX_CHARS).nullable(),
    unreadCount: z.number().int().nonnegative().max(1_000_000),
    peerEmployeeId: entityId.nullable(),
    peerName: z.string().max(MESSENGER_PERSIST_TITLE_MAX_CHARS).nullable(),
    isFavorite: z.boolean(),
    canWrite: z.boolean(),
  })
  .strict();

const clientItemSchema = z
  .object({
    id: entityId,
    zone: z.literal('CLIENT'),
    type: conversationType,
    title: z.string().max(MESSENGER_PERSIST_TITLE_MAX_CHARS).nullable(),
    status: z.string().min(1).max(MESSENGER_PERSIST_STATUS_MAX_CHARS),
    canonicalKey: z.string().max(MESSENGER_PERSIST_TITLE_MAX_CHARS).nullable(),
    createdAt: isoDate,
    lastMessageAt: isoDate.nullable(),
    lastMessagePreview: z.string().max(MESSENGER_PERSIST_PREVIEW_MAX_CHARS).nullable(),
    lastMessageDirection: z.enum(['INBOUND', 'OUTBOUND', 'INTERNAL']).nullable(),
    unreadCount: z.number().int().nonnegative().max(1_000_000),
    isFavorite: z.boolean(),
    canSend: z.boolean(),
    provider: z.enum(['WHATSAPP', 'INSTAGRAM', 'FACEBOOK']).nullable(),
    leadId: entityId.nullable(),
    attention: z.array(attentionSchema).max(MESSENGER_PERSIST_ATTENTION_PER_ROW_MAX),
  })
  .strict();

const collectionRowSchema = z
  .object({
    id: entityId,
    name: z.string().min(1).max(MESSENGER_PERSIST_TITLE_MAX_CHARS),
    visibility: z.enum(['PERSONAL', 'SHARED']),
    zone: z.enum(['INTERNAL', 'CLIENT']),
    ownerEmployeeId: entityId,
  })
  .strict();

export const persistInternalSummaryParamsSchema = z
  .object({ source: z.literal('all-dataset') })
  .strict();

export const persistClientSummaryParamsSchema = z
  .object({
    section: z.literal('inbox'),
    q: z.literal(''),
    filter: z.literal('all'),
    provider: z.literal(''),
  })
  .strict();

const internalPageSchema = z
  .object({
    items: z.array(internalItemSchema).max(MESSENGER_PERSIST_ROWS_PER_QUERY_MAX),
    mentionsAvailable: z.boolean(),
    hasMore: z.boolean().optional(),
    nextCursor: z.string().max(MESSENGER_PERSIST_CURSOR_MAX_CHARS).optional(),
  })
  .strict();

const clientPageSchema = z
  .object({
    items: z.array(clientItemSchema).max(MESSENGER_PERSIST_ROWS_PER_QUERY_MAX),
    hasMore: z.boolean().optional(),
    nextCursor: z.string().max(MESSENGER_PERSIST_CURSOR_MAX_CHARS).optional(),
  })
  .strict();

const collectionListSchema = z
  .array(collectionRowSchema)
  .max(MESSENGER_PERSIST_COLLECTION_LIST_MAX);

export function parsePlainStrict<T>(schema: z.ZodType<T>, value: unknown): T | null {
  if (!areNestedObjectsPlain(value)) return null;
  const parsed = schema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function areNestedObjectsPlain(value: unknown): boolean {
  if (value === null || typeof value !== 'object') return true;
  if (Array.isArray(value)) return value.every(areNestedObjectsPlain);
  if (!isPlainRecord(value)) return false;
  return Object.values(value).every(areNestedObjectsPlain);
}

export function parsePersistedInternalSummaryParams(value: unknown) {
  return isPlainRecord(value) ? parsePlainStrict(persistInternalSummaryParamsSchema, value) : null;
}

export function parsePersistedClientSummaryParams(value: unknown) {
  return isPlainRecord(value) ? parsePlainStrict(persistClientSummaryParamsSchema, value) : null;
}

export function parsePersistedQueryData(
  queryKey: readonly unknown[],
  data: unknown,
): unknown | null {
  if (queryKey[1] === 'internal' && queryKey[2] === 'summaries') {
    return parsePlainStrict(internalPageSchema, data);
  }
  if (queryKey[1] === 'client' && queryKey[2] === 'summaries') {
    return parsePlainStrict(clientPageSchema, data);
  }
  if (queryKey[1] === 'collections') {
    if (!Array.isArray(data)) return null;
    if (data.some((row) => !isPlainRecord(row))) return null;
    return parsePlainStrict(collectionListSchema, data);
  }
  return null;
}
