import { CREDENTIAL_LIST_SELECT } from './credential-list-select';
import { toCredentialWithoutSecrets } from './credential-health.utils';
import type { CredentialTab } from './credential-tab';
import { buildRecentCredentialsWhere } from './credential-recent-where';
import type { CredentialsAccessContext } from './credentials-access';
import type { CredentialRecentQuery } from './credential-recent.types';
import type { CredentialsRuntime } from './credentials-runtime';
import { CREDENTIAL_RECENT_LIMIT } from './credential-recent.constants';

const RECENT_RESOLVE_CHUNK_SIZE = 15;

export async function resolveRecentCredentialItems(
  runtime: CredentialsRuntime,
  access: CredentialsAccessContext,
  candidateIds: string[],
  tab: CredentialTab,
  query: CredentialRecentQuery,
) {
  const items: ReturnType<typeof toCredentialWithoutSecrets>[] = [];
  const seen = new Set<string>();

  for (
    let offset = 0;
    offset < candidateIds.length && items.length < CREDENTIAL_RECENT_LIMIT;
    offset += RECENT_RESOLVE_CHUNK_SIZE
  ) {
    const chunk = candidateIds.slice(offset, offset + RECENT_RESOLVE_CHUNK_SIZE);
    const where = await buildRecentCredentialsWhere(runtime, access, chunk, tab, query);
    const rows = await runtime.prisma.credential.findMany({
      where,
      select: CREDENTIAL_LIST_SELECT,
    });
    const byId = new Map(rows.map((row) => [row.id, row]));

    for (const id of chunk) {
      if (items.length >= CREDENTIAL_RECENT_LIMIT) break;
      if (seen.has(id)) continue;
      const row = byId.get(id);
      if (!row) continue;
      seen.add(id);
      items.push(toCredentialWithoutSecrets(row));
    }
  }

  return items;
}
