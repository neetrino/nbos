'use client';

import { toast } from 'sonner';
import {
  AGENT_MCP_ENV_BEARER,
  agentMcpUrl,
  agentRestUrl,
  buildAgentEnvSnippet,
  buildAgentMcpConfig,
} from './agent-client-setup';

export function useAgentClientSetupCopy(token: string | null, apiOrigin: string) {
  const copyEnv = token
    ? () =>
        void copyText(
          buildAgentEnvSnippet(token, apiOrigin),
          'Copied two .env lines. Paste into .env.local.',
        )
    : null;

  const copyMcp = () => {
    const bearer = token ?? AGENT_MCP_ENV_BEARER;
    void copyText(
      buildAgentMcpConfig(bearer, apiOrigin),
      token
        ? 'Copied MCP config with this token. Merge into ~/.cursor/mcp.json.'
        : 'Copied MCP config. It reads NBOS_AGENT_TOKEN from env. Merge into ~/.cursor/mcp.json.',
    );
  };

  return {
    copyEnv,
    copyMcp,
    restUrl: agentRestUrl(apiOrigin),
    mcpUrl: agentMcpUrl(apiOrigin),
  };
}

async function copyText(text: string, success: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(success);
  } catch {
    toast.error('Copy failed.');
  }
}
