import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { canStartInternalAgentExecution } from '@nbos/shared';
import type {
  ArtifactAuthorizationContext,
  ArtifactAuthorizationPort,
} from './drive-artifact-operation.types';

export function allowArtifactAuth(): ArtifactAuthorizationPort {
  return {
    assertCanPrepare: async () => undefined,
    assertCanFinalize: async () => undefined,
  };
}

export function humanArtifactAuth(input: {
  employeeId: string;
  assertContext: () => Promise<void>;
}): ArtifactAuthorizationPort {
  return {
    async assertCanPrepare(context) {
      assertHumanActor(context, input.employeeId);
      await input.assertContext();
    },
    async assertCanFinalize(context) {
      assertHumanActor(context, input.employeeId);
      await input.assertContext();
    },
  };
}

export function systemArtifactAuth(actorId: string): ArtifactAuthorizationPort {
  return {
    async assertCanPrepare(context) {
      if (context.source !== 'SYSTEM' || context.actorId !== actorId) {
        throw new ForbiddenException('System artifact actor mismatch.');
      }
    },
    async assertCanFinalize(context) {
      if (context.source !== 'SYSTEM' || context.actorId !== actorId) {
        throw new ForbiddenException('System artifact actor mismatch.');
      }
    },
  };
}

export function internalAgentArtifactAuth(input: {
  agent: {
    id: string;
    name: string;
    status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'DISABLED' | 'ARCHIVED';
  };
}): ArtifactAuthorizationPort {
  return {
    async assertCanPrepare(context) {
      assertInternalAgent(context, input.agent);
    },
    async assertCanFinalize(context) {
      assertInternalAgent(context, input.agent);
    },
  };
}

export function externalAgentArtifactAuth(input: {
  agentId: string;
  assertTaskStillAuthorized: (taskId: string) => Promise<void>;
}): ArtifactAuthorizationPort {
  return {
    async assertCanPrepare(context) {
      assertExternalAgent(context, input.agentId);
      await input.assertTaskStillAuthorized(context.entityId);
    },
    async assertCanFinalize(context) {
      assertExternalAgent(context, input.agentId);
      await input.assertTaskStillAuthorized(context.entityId);
    },
  };
}

function assertHumanActor(context: ArtifactAuthorizationContext, employeeId: string): void {
  if (context.source !== 'HUMAN' || context.actorId !== employeeId) {
    throw new ForbiddenException('This upload session belongs to another user.');
  }
}

function assertExternalAgent(context: ArtifactAuthorizationContext, agentId: string): void {
  if (context.source !== 'EXTERNAL_AI' || context.agentId !== agentId) {
    throw new ForbiddenException('External agent artifact actor mismatch.');
  }
}

function assertInternalAgent(
  context: ArtifactAuthorizationContext,
  agent: { id: string; status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'DISABLED' | 'ARCHIVED' },
): void {
  if (context.source !== 'INTERNAL_AI' || context.agentId !== agent.id) {
    throw new ForbiddenException('Internal agent artifact actor mismatch.');
  }
  if (!canStartInternalAgentExecution(agent.status)) {
    throw new BadRequestException('Internal agent is not allowed to start a new execution');
  }
}
