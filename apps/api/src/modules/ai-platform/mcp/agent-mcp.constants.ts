/**
 * MCP protocol revisions this server speaks.
 *
 * The first entry is what an unknown client version negotiates down to.
 */
export const AGENT_MCP_SUPPORTED_PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26'] as const;

export const AGENT_MCP_DEFAULT_PROTOCOL_VERSION = AGENT_MCP_SUPPORTED_PROTOCOL_VERSIONS[0];

export const AGENT_MCP_SERVER_INFO = {
  name: 'nbos-external-agent',
  title: 'NBOS External Agent',
  version: '1.0.0',
} as const;

export const AGENT_MCP_ROUTE = 'mcp';

/** JSON-RPC 2.0 reserved codes. Authorization never travels through these. */
export const JSON_RPC_PARSE_ERROR = -32700;
export const JSON_RPC_INVALID_REQUEST = -32600;
export const JSON_RPC_METHOD_NOT_FOUND = -32601;
export const JSON_RPC_INVALID_PARAMS = -32602;
export const JSON_RPC_INTERNAL_ERROR = -32603;
