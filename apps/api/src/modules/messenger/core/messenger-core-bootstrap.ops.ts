import type { PrismaClient } from '@nbos/database';
import type { TasksAccessContext } from '../../tasks/tasks-scoped-access';
import { listInternalCollections, listClientCollections } from './messenger-core-collection-list.ops';
import {
  ensureClientFavoritesCollection,
  ensureInternalFavoritesCollection,
} from './messenger-core-favorites-ensure.ops';
import type { MessengerCoreCollectionDto } from './messenger-core-collection.ops';
import { listAccessibleClientConversations } from './messenger-core-client-list.ops';
import type { MessengerClientListResult } from './messenger-core-client.types';
import { listAccessibleInternalConversations } from './messenger-core-internal-list.ops';
import type { MessengerInternalListResult } from './messenger-core-internal.types';
import { messengerAuthorizationEpoch } from './messenger-core-auth-epoch';
import { isMessengerDeltaRecoveryEnabled } from './messenger-core-recovery-flag';
import { snapshotMessengerZoneRead } from './messenger-core-revision-snapshot.ops';
import {
  createMessengerInternalAccessSnapshot,
  type MessengerInternalAccessSnapshot,
} from './messenger-core-access-snapshot';
import {
  createMessengerGrantSnapshot,
  digestMessengerGrantSnapshot,
  type MessengerGrantSnapshot,
} from './messenger-core-grant-epoch';
import {
  MESSENGER_RECOVERY_MODE_DELTA,
  MESSENGER_RECOVERY_MODE_FULL,
} from './messenger-core-revision.constants';
import type { MessengerZoneAccessFingerprintInput } from './messenger-core-revision.types';

type PrismaLike = InstanceType<typeof PrismaClient>;

export type MessengerInternalBootstrapResult = {
  summaries: MessengerInternalListResult;
  collections: MessengerCoreCollectionDto[];
  recoveryMode: typeof MESSENGER_RECOVERY_MODE_FULL | typeof MESSENGER_RECOVERY_MODE_DELTA;
  checkpoint: string | null;
  authorizationEpoch: string | null;
};

export type MessengerClientBootstrapResult = {
  summaries: MessengerClientListResult;
  collections: MessengerCoreCollectionDto[];
  recoveryMode: typeof MESSENGER_RECOVERY_MODE_FULL | typeof MESSENGER_RECOVERY_MODE_DELTA;
  checkpoint: string | null;
  authorizationEpoch: string | null;
};

export async function loadInternalMessengerBootstrap(
  prisma: PrismaLike,
  access: MessengerZoneAccessFingerprintInput,
  tasksAccess?: TasksAccessContext,
): Promise<MessengerInternalBootstrapResult> {
  await ensureInternalFavoritesCollection(prisma, access.employeeId);
  if (!isMessengerDeltaRecoveryEnabled()) {
    return { ...(await readInternalDefaults(prisma, access, tasksAccess)), ...fullRecovery() };
  }
  const acl = await createMessengerInternalAccessSnapshot(prisma, access.employeeId, tasksAccess);
  const snap = await snapshotMessengerZoneRead(prisma, 'INTERNAL', (client) =>
    readInternalDefaults(client, access, tasksAccess, acl),
  );
  return {
    ...snap.value,
    recoveryMode: MESSENGER_RECOVERY_MODE_DELTA,
    checkpoint: snap.checkpoint,
    authorizationEpoch: messengerAuthorizationEpoch({
      ...access,
      taskAclDigest: acl.tasks.digest,
      grantAclDigest: digestMessengerGrantSnapshot(acl.grants),
    }),
  };
}

export async function loadClientMessengerBootstrap(
  prisma: PrismaLike,
  access: MessengerZoneAccessFingerprintInput,
): Promise<MessengerClientBootstrapResult> {
  await ensureClientFavoritesCollection(prisma, access.employeeId);
  if (!isMessengerDeltaRecoveryEnabled()) {
    return { ...(await readClientDefaults(prisma, access)), ...fullRecovery() };
  }
  const grants = await createMessengerGrantSnapshot(prisma, access.employeeId, 'CLIENT');
  const snap = await snapshotMessengerZoneRead(prisma, 'CLIENT', (client) =>
    readClientDefaults(client, access, grants),
  );
  return {
    ...snap.value,
    recoveryMode: MESSENGER_RECOVERY_MODE_DELTA,
    checkpoint: snap.checkpoint,
    authorizationEpoch: messengerAuthorizationEpoch({
      ...access,
      grantAclDigest: digestMessengerGrantSnapshot(grants),
    }),
  };
}

async function readInternalDefaults(
  prisma: PrismaLike,
  access: MessengerZoneAccessFingerprintInput,
  tasksAccess?: TasksAccessContext,
  acl?: MessengerInternalAccessSnapshot,
) {
  const [summaries, collections] = await Promise.all([
    listAccessibleInternalConversations(
      prisma,
      access.employeeId,
      access.viewScope,
      { section: 'all' },
      access.editScope,
      tasksAccess,
      acl,
    ),
    listInternalCollections(prisma, access.employeeId),
  ]);
  return { summaries, collections };
}

async function readClientDefaults(
  prisma: PrismaLike,
  access: MessengerZoneAccessFingerprintInput,
  grants?: MessengerGrantSnapshot,
) {
  const [summaries, collections] = await Promise.all([
    listAccessibleClientConversations(
      prisma,
      access.employeeId,
      access.clientReadScope,
      access.clientSendScope,
      { section: 'inbox' },
      grants,
    ),
    listClientCollections(prisma, access.employeeId),
  ]);
  return { summaries, collections };
}

function fullRecovery() {
  return {
    recoveryMode: MESSENGER_RECOVERY_MODE_FULL,
    checkpoint: null,
    authorizationEpoch: null,
  } as const;
}
