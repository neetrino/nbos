import type {
  AgentCapabilityGrantView,
  AgentResourceScopeView,
  ExternalAgentView,
} from '../agents/external-agent.mapper';
import { isCurrentGrant } from '../grants/grant-current';

export interface WorkspaceAccessRow {
  workspaceId: string;
  scope: AgentResourceScopeView;
  agent: ExternalAgentView | null;
  capabilities: AgentCapabilityGrantView[];
}

export function toWorkspaceAccessRows(
  workspaceId: string,
  rows: Array<{
    scope: AgentResourceScopeView;
    agent: ExternalAgentView | null;
    capabilities: AgentCapabilityGrantView[];
  }>,
): WorkspaceAccessRow[] {
  return rows.map((row) => ({
    workspaceId,
    scope: row.scope,
    agent: row.agent,
    capabilities: row.capabilities.filter((grant) => isCurrentGrant(grant)),
  }));
}
