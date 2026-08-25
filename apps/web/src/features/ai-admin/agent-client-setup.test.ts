import { describe, expect, it } from 'vitest';
import {
  AGENT_MCP_ENV_BEARER,
  AGENT_MCP_SERVER_KEY,
  LOCAL_AGENT_API_ORIGIN,
  agentMcpUrl,
  agentRestUrl,
  buildAgentEnvSnippet,
  buildAgentMcpConfig,
  resolvePublicAgentApiOrigin,
} from './agent-client-setup';

const ORIGIN = 'https://nbos-api.example.com';
const TOKEN = 'nbos_agt_abc_secret';

describe('resolvePublicAgentApiOrigin', () => {
  it('uses the public API origin and strips a trailing slash', () => {
    expect(resolvePublicAgentApiOrigin('https://nbos-api.example.com/')).toBe(ORIGIN);
  });

  it('falls back to local Nest when the public origin is missing', () => {
    expect(resolvePublicAgentApiOrigin(undefined)).toBe(LOCAL_AGENT_API_ORIGIN);
    expect(resolvePublicAgentApiOrigin('   ')).toBe(LOCAL_AGENT_API_ORIGIN);
  });
});

describe('agent URLs', () => {
  it('builds REST and MCP paths on the API origin, not the web dashboard', () => {
    expect(agentRestUrl(`${ORIGIN}/`)).toBe(`${ORIGIN}/api/v1/agent`);
    expect(agentMcpUrl(ORIGIN)).toBe(`${ORIGIN}/api/v1/agent/mcp`);
  });
});

describe('buildAgentEnvSnippet', () => {
  it('copies two key=value lines for API-only clients', () => {
    expect(buildAgentEnvSnippet(TOKEN, ORIGIN)).toBe(
      `NBOS_AGENT_API_URL="${ORIGIN}/api/v1/agent"\nNBOS_AGENT_TOKEN="${TOKEN}"\n`,
    );
  });

  it('escapes quotes in the token', () => {
    expect(buildAgentEnvSnippet('abc"def', ORIGIN)).toContain('NBOS_AGENT_TOKEN="abc\\"def"');
  });
});

describe('buildAgentMcpConfig', () => {
  it('copies a mergeable mcpServers.nbos block', () => {
    const parsed = JSON.parse(buildAgentMcpConfig(TOKEN, ORIGIN)) as {
      mcpServers: Record<string, { url: string; headers: { Authorization: string } }>;
    };
    expect(parsed.mcpServers[AGENT_MCP_SERVER_KEY]).toEqual({
      url: `${ORIGIN}/api/v1/agent/mcp`,
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
  });

  it('can copy a page snippet that reads the token from env', () => {
    const parsed = JSON.parse(buildAgentMcpConfig(AGENT_MCP_ENV_BEARER, ORIGIN)) as {
      mcpServers: Record<string, { headers: { Authorization: string } }>;
    };
    expect(parsed.mcpServers[AGENT_MCP_SERVER_KEY]?.headers.Authorization).toBe(
      'Bearer ${env:NBOS_AGENT_TOKEN}',
    );
  });
});
