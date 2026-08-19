import type { TransactionClient } from '@nbos/database';
import { findOpenLeadByInstagramUsername } from '../../crm/leads/lead-duplicate-lookup.ops';

/**
 * Attach a new Meta conversation to an open Lead that already has this Instagram
 * identity. If that Lead already has a conversation (1:1), do not create a second
 * Lead and do not overwrite the existing `leadId`.
 */
export async function resolveMetaIngestLeadId(
  tx: TransactionClient,
  username: string | null | undefined,
  createLead: () => Promise<string>,
): Promise<string | null> {
  const existing = await findOpenLeadByInstagramUsername(tx, username);
  if (!existing) {
    return createLead();
  }

  const occupied = await tx.metaConversation.findUnique({
    where: { leadId: existing.id },
    select: { id: true },
  });
  if (occupied) {
    return null;
  }
  return existing.id;
}
