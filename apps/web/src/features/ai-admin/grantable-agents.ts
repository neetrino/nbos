import type { ExternalAgentBundle } from '@/lib/api/ai-admin';
import { canGrantExternalAgentAccess } from './external-agent-actions';

export function grantableExternalAgents(
  bundles: ExternalAgentBundle[],
  alreadyGrantedIds: ReadonlySet<string>,
): ExternalAgentBundle[] {
  return bundles.filter(
    (row) => canGrantExternalAgentAccess(row.agent.state) && !alreadyGrantedIds.has(row.agent.id),
  );
}
