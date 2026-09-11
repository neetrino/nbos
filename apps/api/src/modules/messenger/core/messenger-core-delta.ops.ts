import { BadRequestException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import type { TasksAccessContext } from '../../tasks/tasks-scoped-access';
import { listAccessibleClientConversationsByIds } from './messenger-core-client-list.ops';
import type { MessengerClientConversationListItem } from './messenger-core-client.types';
import { listAccessibleInternalConversationsByIds } from './messenger-core-internal-list.ops';
import type { MessengerInternalConversationListItem } from './messenger-core-internal.types';
import { assembleMessengerDeltaPage } from './messenger-core-delta-assemble';
import { planMessengerDeltaHydration, splitDeltaPage } from './messenger-core-delta-plan';
import { buildMessengerDeltaChangeSql, mapDeltaChangeRows } from './messenger-core-delta-sql';
import { messengerAuthorizationEpoch } from './messenger-core-auth-epoch';
import {
  encodeMessengerDeltaCursor,
  parseMessengerCheckpoint,
  parseMessengerDeltaCursor,
} from './messenger-core-delta-cursor';
import {
  MESSENGER_RECOVERY_MODE_DELTA,
  messengerDeltaPageSize,
  revisionToCheckpoint,
} from './messenger-core-revision.constants';
import { shareLockZoneRevision } from './messenger-core-revision-write.ops';
import { runMessengerReadTx } from './messenger-core-revision-tx';
import { createMessengerInternalAccessSnapshot } from './messenger-core-access-snapshot';
import {
  createMessengerGrantSnapshot,
  digestMessengerGrantSnapshot,
} from './messenger-core-grant-epoch';
import type {
  MessengerClientDeltaResult,
  MessengerDeltaChangeRow,
  MessengerDeltaQuery,
  MessengerInternalDeltaResult,
  MessengerZoneAccessFingerprintInput,
} from './messenger-core-revision.types';

type PrismaLike = InstanceType<typeof PrismaClient>;

export async function loadInternalMessengerDelta(
  prisma: PrismaLike,
  access: MessengerZoneAccessFingerprintInput,
  tasksAccess: TasksAccessContext | undefined,
  query: MessengerDeltaQuery,
): Promise<MessengerInternalDeltaResult> {
  const acl = await createMessengerInternalAccessSnapshot(prisma, access.employeeId, tasksAccess);
  const epoch = messengerAuthorizationEpoch({
    ...access,
    taskAclDigest: acl.tasks.digest,
    grantAclDigest: digestMessengerGrantSnapshot(acl.grants),
  });
  if (!query.authorizationEpoch || query.authorizationEpoch !== epoch) {
    return emptyDelta('0', epoch, true);
  }
  const captured = await captureDeltaHighWater(prisma, 'INTERNAL', query);
  const page = await loadDeltaChangePage(prisma, 'INTERNAL', access.employeeId, query, captured);
  const authorized = await listAccessibleInternalConversationsByIds(
    prisma,
    access.employeeId,
    access.viewScope,
    page.rows.map((row) => row.conversationId),
    access.editScope,
    tasksAccess,
    acl,
  );
  return toInternalDelta(page, authorized, captured.checkpoint, epoch);
}

export async function loadClientMessengerDelta(
  prisma: PrismaLike,
  access: MessengerZoneAccessFingerprintInput,
  query: MessengerDeltaQuery,
): Promise<MessengerClientDeltaResult> {
  const grants = await createMessengerGrantSnapshot(prisma, access.employeeId, 'CLIENT');
  const epoch = messengerAuthorizationEpoch({
    ...access,
    grantAclDigest: digestMessengerGrantSnapshot(grants),
  });
  if (!query.authorizationEpoch || query.authorizationEpoch !== epoch) {
    return emptyDelta('0', epoch, true);
  }
  const captured = await captureDeltaHighWater(prisma, 'CLIENT', query);
  const page = await loadDeltaChangePage(prisma, 'CLIENT', access.employeeId, query, captured);
  const authorized = await listAccessibleClientConversationsByIds(
    prisma,
    access.employeeId,
    access.clientReadScope,
    access.clientSendScope,
    page.rows.map((row) => row.conversationId),
    grants,
  );
  return toClientDelta(page, authorized, captured.checkpoint, epoch);
}

export async function captureDeltaHighWater(
  prisma: PrismaLike,
  zone: 'INTERNAL' | 'CLIENT',
  query: MessengerDeltaQuery,
): Promise<{ highWater: bigint; checkpoint: string }> {
  return runMessengerReadTx(prisma, async (tx) => {
    const live = await shareLockZoneRevision(tx, zone);
    const after = parseMessengerCheckpoint(query.after);
    if (after > live) throw new BadRequestException('Invalid revision checkpoint');
    const cursor = parseMessengerDeltaCursor(query.cursor);
    if (!cursor) return { highWater: live, checkpoint: revisionToCheckpoint(live) };
    assertCursorConsistent(cursor, after, live);
    return { highWater: parseMessengerCheckpoint(cursor.highWater), checkpoint: cursor.highWater };
  });
}

function assertCursorConsistent(
  cursor: { highWater: string; revision: string },
  after: bigint,
  live: bigint,
): void {
  const highWater = parseMessengerCheckpoint(cursor.highWater);
  const revision = parseMessengerCheckpoint(cursor.revision);
  if (highWater > live || revision > highWater || after > highWater) {
    throw invalidCursor();
  }
}

async function loadDeltaChangePage(
  tx: PrismaLike,
  zone: 'INTERNAL' | 'CLIENT',
  employeeId: string,
  query: MessengerDeltaQuery,
  captured: { highWater: bigint; checkpoint: string },
): Promise<{ rows: MessengerDeltaChangeRow[]; hasMore: boolean }> {
  const cursor = parseMessengerDeltaCursor(query.cursor);
  if (cursor && cursor.highWater !== captured.checkpoint) throw invalidCursor();
  const pageSize = query.pageSize ?? messengerDeltaPageSize(zone);
  const raw = await tx.$queryRaw<Parameters<typeof mapDeltaChangeRows>[0]>(
    buildMessengerDeltaChangeSql({
      zone,
      employeeId,
      after: query.after,
      highWater: captured.checkpoint,
      cursor,
      pageSize,
    }),
  );
  const sliced = splitDeltaPage(mapDeltaChangeRows(raw), pageSize);
  return { rows: sliced.items, hasMore: sliced.hasMore };
}

function toInternalDelta(
  page: { rows: MessengerDeltaChangeRow[]; hasMore: boolean },
  authorized: MessengerInternalConversationListItem[],
  checkpoint: string,
  authorizationEpoch: string,
): MessengerInternalDeltaResult {
  return {
    recoveryMode: MESSENGER_RECOVERY_MODE_DELTA,
    checkpoint,
    authorizationEpoch,
    resetRequired: false,
    ...assembleMessengerDeltaPage(page.rows, planMessengerDeltaHydration(page.rows), authorized),
    hasMore: page.hasMore,
    nextCursor: nextCursor(page, checkpoint),
  };
}

function toClientDelta(
  page: { rows: MessengerDeltaChangeRow[]; hasMore: boolean },
  authorized: MessengerClientConversationListItem[],
  checkpoint: string,
  authorizationEpoch: string,
): MessengerClientDeltaResult {
  return {
    recoveryMode: MESSENGER_RECOVERY_MODE_DELTA,
    checkpoint,
    authorizationEpoch,
    resetRequired: false,
    ...assembleMessengerDeltaPage(page.rows, planMessengerDeltaHydration(page.rows), authorized),
    hasMore: page.hasMore,
    nextCursor: nextCursor(page, checkpoint),
  };
}

function nextCursor(
  page: { rows: MessengerDeltaChangeRow[]; hasMore: boolean },
  highWater: string,
): string | undefined {
  const last = page.rows[page.rows.length - 1];
  if (!page.hasMore || !last) return undefined;
  return encodeMessengerDeltaCursor({
    highWater,
    revision: last.revision,
    conversationId: last.conversationId,
  });
}

function emptyDelta<T>(
  checkpoint: string,
  authorizationEpoch: string,
  resetRequired: boolean,
): {
  recoveryMode: typeof MESSENGER_RECOVERY_MODE_DELTA;
  checkpoint: string;
  authorizationEpoch: string;
  resetRequired: boolean;
  summaries: T[];
  removedConversationIds: string[];
  changedConversationIds: string[];
  hasMore: boolean;
} {
  return {
    recoveryMode: MESSENGER_RECOVERY_MODE_DELTA,
    checkpoint,
    authorizationEpoch,
    resetRequired,
    summaries: [],
    removedConversationIds: [],
    changedConversationIds: [],
    hasMore: false,
  };
}

function invalidCursor(): BadRequestException {
  return new BadRequestException('Invalid delta cursor');
}
