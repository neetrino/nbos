import { AgentAccessException } from '../auth/agent-auth.errors';

/**
 * Protocol ceiling for a single inline artifact upload.
 *
 * The API caps JSON bodies at 1 MB, and base64 inflates by 4/3, so 512 KiB of
 * content plus metadata stays inside that budget with room to spare. This is a
 * transport guard, not the per-agent payload policy (checklist U 326).
 */
export const AGENT_ARTIFACT_MAX_BYTES = 512 * 1024;

const BASE64_PATTERN = /^[A-Za-z0-9+/]*={0,2}$/;
const BASE64_BLOCK = 4;

/**
 * Decodes inline artifact content for both protocols.
 *
 * REST and MCP both carry the bytes as base64 in the request body, and both
 * hand the decoded buffer to `invoke({ payload })`. The bytes never become a
 * capability input field, so they are not part of the JSON the catalog
 * allowlist validates, and the idempotency fingerprint covers the real content.
 */
export function decodeAgentArtifactContent(value: unknown): Uint8Array {
  if (typeof value !== 'string' || value.length === 0) {
    throw AgentAccessException.validationFailed('contentBase64 is required');
  }
  const normalized = value.trim();
  if (normalized.length % BASE64_BLOCK !== 0 || !BASE64_PATTERN.test(normalized)) {
    throw AgentAccessException.validationFailed('contentBase64 must be valid base64');
  }
  const bytes = Buffer.from(normalized, 'base64');
  if (bytes.byteLength === 0) {
    throw AgentAccessException.validationFailed('contentBase64 is required');
  }
  if (bytes.byteLength > AGENT_ARTIFACT_MAX_BYTES) {
    throw AgentAccessException.validationFailed(
      `Artifact content exceeds ${AGENT_ARTIFACT_MAX_BYTES} bytes`,
    );
  }
  return new Uint8Array(bytes);
}
