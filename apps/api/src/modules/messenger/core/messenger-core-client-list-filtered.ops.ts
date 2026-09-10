import type { PrismaClient } from '@nbos/database';
import { sql } from '@nbos/database';
import {
  MESSENGER_CORE_CLIENT_ZONE,
  type MessengerClientSection,
} from './messenger-core.constants';
import type { MessengerClientListQuery } from './messenger-core-client.types';
import {
  sqlAfterListCursor,
  sqlIlikeContains,
  sqlListOrderLimit,
  sqlNeedsResponsePredicate,
  sqlParticipantOrGrantedAccess,
  sqlReadStateJoin,
  sqlTrue,
  sqlUnreadPredicate,
  sqlVisibleLatestMessageJoin,
  type SqlFragment,
} from './messenger-core-list-sql';
import type { MessengerListCursor } from './messenger-core-list-page';

type PrismaLike = Pick<InstanceType<typeof PrismaClient>, '$queryRaw'>;

export type ClientFilteredListSqlInput = {
  employeeId: string;
  clientReadScope: string;
  grantIds: string[];
  section?: MessengerClientSection;
  q?: string;
  provider?: MessengerClientListQuery['provider'];
  cursor?: MessengerListCursor;
  take: number;
  kind: 'unread' | 'needs_response';
};

export async function selectClientFilteredConversationIds(
  prisma: PrismaLike,
  input: ClientFilteredListSqlInput,
): Promise<MessengerListCursor[]> {
  return prisma.$queryRaw<MessengerListCursor[]>(buildClientFilteredIdSql(input));
}

export function buildClientFilteredIdSql(input: ClientFilteredListSqlInput): SqlFragment {
  const attention =
    input.kind === 'unread' ? sqlUnreadPredicate(input.employeeId) : sqlNeedsResponsePredicate();
  return sql`
    SELECT c.id, c.last_message_at AS "lastMessageAt", c.created_at AS "createdAt"
    FROM messenger_conversations c
    ${sqlVisibleLatestMessageJoin(false)}
    ${sqlReadStateJoin(input.employeeId)}
    WHERE c.zone = ${MESSENGER_CORE_CLIENT_ZONE}
      AND c.status = 'ACTIVE'
      AND ${sqlClientAccess(input.employeeId, input.clientReadScope, input.grantIds)}
      AND ${sqlClientSection(input.section)}
      AND ${sqlClientSearch(input.q)}
      AND ${sqlClientProvider(input.provider)}
      AND ${sqlAfterListCursor(input.cursor)}
      AND ${attention}
    ${sqlListOrderLimit(input.take)}`;
}

function sqlClientAccess(
  employeeId: string,
  clientReadScope: string,
  grantIds: string[],
): SqlFragment {
  if (clientReadScope === 'ALL') return sqlTrue();
  return sqlParticipantOrGrantedAccess(employeeId, grantIds);
}

function sqlClientSection(section: MessengerClientSection | undefined): SqlFragment {
  if (!section || section === 'inbox' || section === 'collections') return sqlTrue();
  if (section === 'sales') {
    return sql`(
      EXISTS (
        SELECT 1 FROM messenger_conversation_links l
        WHERE l.conversation_id = c.id AND l.entity_type = 'LEAD'
      )
      OR EXISTS (
        SELECT 1 FROM messenger_external_conversation_mappings em
        WHERE em.conversation_id = c.id AND em.provider IN ('INSTAGRAM', 'FACEBOOK')
      )
    )`;
  }
  return sql`EXISTS (
    SELECT 1 FROM messenger_conversation_links l
    WHERE l.conversation_id = c.id AND l.entity_type IN ('CLIENT', 'PRODUCT')
  )`;
}

function sqlClientSearch(q: string | undefined): SqlFragment {
  const term = q?.trim();
  if (!term) return sqlTrue();
  const like = sqlIlikeContains(term);
  return sql`(
    c.title ILIKE ${like}
    OR EXISTS (
      SELECT 1 FROM messenger_messages m
      WHERE m.conversation_id = c.id
        AND m.deleted_at IS NULL
        AND m.content ILIKE ${like}
    )
  )`;
}

function sqlClientProvider(provider: MessengerClientListQuery['provider']): SqlFragment {
  if (!provider) return sqlTrue();
  return sql`EXISTS (
    SELECT 1 FROM messenger_external_conversation_mappings em
    WHERE em.conversation_id = c.id AND em.provider = ${provider}
  )`;
}
