import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import {
  externalAgentArtifactAuth,
  humanArtifactAuth,
  internalAgentArtifactAuth,
} from './drive-artifact-auth.ports';

const HUMAN = {
  source: 'HUMAN' as const,
  actorType: 'EMPLOYEE',
  actorId: 'emp-1',
  createdByEmployeeId: 'emp-1',
  entityType: 'TASK',
  entityId: 'task-1',
};

describe('artifact authorization ports', () => {
  it('revalidates the human employee and Drive context before finalize', async () => {
    const assertContext = vi.fn().mockResolvedValue(undefined);
    const auth = humanArtifactAuth({ employeeId: 'emp-1', assertContext });
    await auth.assertCanFinalize(HUMAN);
    expect(assertContext).toHaveBeenCalled();
    await expect(auth.assertCanFinalize({ ...HUMAN, actorId: 'emp-other' })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('blocks a paused Internal Agent before a resumed finalize', async () => {
    const auth = internalAgentArtifactAuth({
      agent: { id: 'ia-1', name: 'Helper', status: 'PAUSED' },
    });
    await expect(
      auth.assertCanFinalize({
        source: 'INTERNAL_AI',
        actorType: 'INTERNAL_AI',
        actorId: 'ia-1',
        agentId: 'ia-1',
        entityType: 'TASK',
        entityId: 'task-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('revalidates External Agent task authorization and rejects object-as-auth', async () => {
    const assertTaskStillAuthorized = vi.fn().mockRejectedValue(new ForbiddenException('revoked'));
    const auth = externalAgentArtifactAuth({
      agentId: 'agent-1',
      assertTaskStillAuthorized,
    });
    await expect(
      auth.assertCanFinalize({
        source: 'EXTERNAL_AI',
        actorType: 'EXTERNAL_AI',
        actorId: 'agent-1',
        agentId: 'agent-1',
        entityType: 'TASK',
        entityId: 'task-1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(assertTaskStillAuthorized).toHaveBeenCalledWith('task-1');
  });
});
