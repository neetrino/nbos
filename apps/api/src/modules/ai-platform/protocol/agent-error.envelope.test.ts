import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { AI_AGENT_ERROR_CODES } from '@nbos/shared';
import { AgentAccessException } from '../auth/agent-auth.errors';
import { toAgentErrorResponse } from './agent-error.envelope';

const REQUEST_ID = 'corr-1';

describe('agent error envelope', () => {
  it('renders the contract shape with a stable code and the correlation id', () => {
    const response = toAgentErrorResponse(AgentAccessException.resourceNotAvailable(), REQUEST_ID);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: 'AGENT_RESOURCE_NOT_AVAILABLE',
        message: 'The requested resource is not available to this agent.',
        requestId: REQUEST_ID,
      },
    });
  });

  it('keeps a missing resource indistinguishable from an unauthorized one', () => {
    const missing = toAgentErrorResponse(AgentAccessException.resourceNotAvailable(), REQUEST_ID);
    const outOfScope = toAgentErrorResponse(
      AgentAccessException.fromDenyReason('RESOURCE_OUT_OF_SCOPE'),
      REQUEST_ID,
    );

    expect(outOfScope).toEqual(missing);
  });

  it('does not reveal which capability was missing', () => {
    const ungranted = toAgentErrorResponse(
      AgentAccessException.fromDenyReason('CAPABILITY_NOT_GRANTED'),
      REQUEST_ID,
    );
    const unknown = toAgentErrorResponse(
      AgentAccessException.fromDenyReason('CAPABILITY_UNKNOWN'),
      REQUEST_ID,
    );

    expect(ungranted).toEqual(unknown);
  });

  it('preserves deliberate validation feedback from the capability layer', () => {
    const response = toAgentErrorResponse(
      AgentAccessException.validationFailed('Unknown field: status'),
      REQUEST_ID,
    );

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('AGENT_VALIDATION_FAILED');
    expect(response.body.error.message).toBe('Unknown field: status');
  });

  it('re-phrases framework exceptions so internal wording cannot leak', () => {
    const response = toAgentErrorResponse(
      new UnauthorizedException('Employee not found'),
      REQUEST_ID,
    );

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AGENT_AUTH_INVALID');
    expect(response.body.error.message).toBe('Authentication failed.');
    expect(response.body.error.message).not.toContain('Employee');
  });

  it.each([
    [new BadRequestException('nope'), 400, 'AGENT_VALIDATION_FAILED'],
    [new ForbiddenException('No permission: TASKS.VIEW'), 403, 'AGENT_CAPABILITY_DENIED'],
    [new NotFoundException('Task 42 missing'), 404, 'AGENT_RESOURCE_NOT_AVAILABLE'],
    [new ConflictException('version clash'), 409, 'AGENT_CONFLICT'],
    [new HttpException('slow down', 429), 429, 'AGENT_RATE_LIMITED'],
  ])('maps %# to a documented code', (error, status, code) => {
    const response = toAgentErrorResponse(error, REQUEST_ID);
    expect(response.status).toBe(status);
    expect(response.body.error.code).toBe(code);
  });

  it('answers an unexpected fault with a deterministic internal code', () => {
    const response = toAgentErrorResponse(
      new Error('connect ECONNREFUSED 10.0.0.1:5432'),
      REQUEST_ID,
    );

    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('AGENT_INTERNAL_ERROR');
    expect(response.body.error.message).toBe('An unexpected error occurred.');
    expect(response.body.error.message).not.toContain('ECONNREFUSED');
  });

  it('maps an unmapped HTTP status to the internal code and a 500', () => {
    const response = toAgentErrorResponse(new HttpException('teapot', 418), REQUEST_ID);

    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('AGENT_INTERNAL_ERROR');
  });

  it('only ever emits documented error codes', () => {
    const errors = [
      AgentAccessException.conflict(),
      AgentAccessException.idempotencyConflict(),
      AgentAccessException.approvalRequired(),
      new NotFoundException(),
      new Error('boom'),
    ];

    for (const error of errors) {
      expect(AI_AGENT_ERROR_CODES).toContain(
        toAgentErrorResponse(error, REQUEST_ID).body.error.code,
      );
    }
  });
});
