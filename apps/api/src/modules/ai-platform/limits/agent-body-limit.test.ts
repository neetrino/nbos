import { describe, expect, it } from 'vitest';
import { AgentAccessException } from '../auth/agent-auth.errors';
import {
  AGENT_HTTP_PATH_PREFIX,
  isAgentRequestPath,
  toAgentBodyError,
} from './agent-body-limit.middleware';

const HTTP_PAYLOAD_TOO_LARGE = 413;
const HTTP_BAD_REQUEST = 400;

function bodyParserError(type: string): Error & { type: string } {
  return Object.assign(new Error(type), { type });
}

describe('agent body ceiling mapping (U 326)', () => {
  it.each([
    ['a body over the ceiling', 'entity.too.large'],
    ['a body that lied about its length', 'request.size.did.not.match.content.length'],
  ])('answers 413 with the contract code for %s', (_label, type) => {
    const mapped = toAgentBodyError(bodyParserError(type));

    expect(mapped).toBeInstanceOf(AgentAccessException);
    expect(mapped?.getStatus()).toBe(HTTP_PAYLOAD_TOO_LARGE);
    expect(mapped?.code).toBe('AGENT_VALIDATION_FAILED');
  });

  it('answers 400 for a body the transport could not read as JSON', () => {
    const mapped = toAgentBodyError(bodyParserError('entity.parse.failed'));

    expect(mapped?.getStatus()).toBe(HTTP_BAD_REQUEST);
    expect(mapped?.code).toBe('AGENT_VALIDATION_FAILED');
  });

  it('leaves an unrelated failure to the rest of the chain', () => {
    expect(toAgentBodyError(new Error('boom'))).toBeNull();
    expect(toAgentBodyError(bodyParserError('something.else'))).toBeNull();
    expect(toAgentBodyError(null)).toBeNull();
  });
});

describe('agent namespace path match', () => {
  it.each([
    [`${AGENT_HTTP_PATH_PREFIX}`, true],
    [`${AGENT_HTTP_PATH_PREFIX}/me`, true],
    [`${AGENT_HTTP_PATH_PREFIX}/mcp`, true],
    ['/api/tasks', false],
    [`${AGENT_HTTP_PATH_PREFIX}-other/me`, false],
  ])('treats %s as agent traffic: %s', (path, expected) => {
    expect(isAgentRequestPath(path)).toBe(expected);
  });
});
