import { describe, expect, it } from 'vitest';
import { AgentAccessException } from '../auth/agent-auth.errors';
import { AGENT_ARTIFACT_MAX_BYTES, decodeAgentArtifactContent } from './agent-artifact-content';

function expectValidationFailure(value: unknown): void {
  try {
    decodeAgentArtifactContent(value);
    throw new Error('expected a validation failure');
  } catch (error) {
    expect(error).toBeInstanceOf(AgentAccessException);
    expect((error as AgentAccessException).code).toBe('AGENT_VALIDATION_FAILED');
  }
}

describe('agent artifact content', () => {
  it('decodes base64 into the bytes Drive will store', () => {
    const bytes = decodeAgentArtifactContent(Buffer.from('report body').toString('base64'));

    expect(Buffer.from(bytes).toString('utf8')).toBe('report body');
  });

  it('rejects a missing or empty payload', () => {
    expectValidationFailure(undefined);
    expectValidationFailure('');
    expectValidationFailure(null);
  });

  it('rejects a non-string payload', () => {
    expectValidationFailure({ bytes: [1, 2, 3] });
    expectValidationFailure(42);
  });

  it('rejects content that is not valid base64 instead of silently truncating it', () => {
    expectValidationFailure('not base64!!');
    expectValidationFailure('YWJj*');
  });

  it('rejects content above the protocol ceiling', () => {
    const oversized = Buffer.alloc(AGENT_ARTIFACT_MAX_BYTES + 1, 1).toString('base64');

    expectValidationFailure(oversized);
  });

  it('accepts content exactly at the ceiling', () => {
    const atLimit = Buffer.alloc(AGENT_ARTIFACT_MAX_BYTES, 1).toString('base64');

    expect(decodeAgentArtifactContent(atLimit).byteLength).toBe(AGENT_ARTIFACT_MAX_BYTES);
  });
});
