export const LOCAL_AGENT_API_ORIGIN = 'http://localhost:4000';
export const AGENT_REST_PATH = '/api/v1/agent';
export const AGENT_MCP_PATH = '/api/v1/agent/mcp';
export const AGENT_MCP_SERVER_KEY = 'nbos';
export const NBOS_AGENT_TOKEN_ENV_KEY = 'NBOS_AGENT_TOKEN';
export const NBOS_AGENT_API_URL_ENV_KEY = 'NBOS_AGENT_API_URL';
/** Cursor interpolates this from process env. Do not use a template literal here. */
export const AGENT_MCP_ENV_BEARER = '${env:NBOS_AGENT_TOKEN}';

export function resolvePublicAgentApiOrigin(envOrigin: string | undefined): string {
  const trimmed = envOrigin?.trim().replace(/\/+$/, '') ?? '';
  return trimmed || LOCAL_AGENT_API_ORIGIN;
}

export function agentRestUrl(apiOrigin: string): string {
  return `${normalizeOrigin(apiOrigin)}${AGENT_REST_PATH}`;
}

export function agentMcpUrl(apiOrigin: string): string {
  return `${normalizeOrigin(apiOrigin)}${AGENT_MCP_PATH}`;
}

export function buildAgentEnvSnippet(token: string, apiOrigin: string): string {
  return [
    envAssignment(NBOS_AGENT_API_URL_ENV_KEY, agentRestUrl(apiOrigin)),
    envAssignment(NBOS_AGENT_TOKEN_ENV_KEY, token),
    '',
  ].join('\n');
}

export function buildAgentMcpConfig(token: string, apiOrigin: string): string {
  return `${JSON.stringify(
    {
      mcpServers: {
        [AGENT_MCP_SERVER_KEY]: {
          url: agentMcpUrl(apiOrigin),
          headers: { Authorization: `Bearer ${token}` },
        },
      },
    },
    null,
    2,
  )}\n`;
}

function normalizeOrigin(apiOrigin: string): string {
  return apiOrigin.trim().replace(/\/+$/, '');
}

function envAssignment(key: string, value: string): string {
  return `${key}="${escapeEnvValue(value)}"`;
}

function escapeEnvValue(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}
