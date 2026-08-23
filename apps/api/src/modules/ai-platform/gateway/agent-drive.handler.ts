import { Injectable, NotFoundException } from '@nestjs/common';
import { isDriveConfidentialityForbiddenToAgents } from '../../drive/drive-ai-classification';
import { DriveTaskArtifactService } from '../../drive/drive-task-artifact.service';
import type { CanonicalWorkSpace } from '../../tasks/work-space-canonical.op';
import type { AuthenticatedAgent } from '../auth/agent-authenticator.service';
import { AgentAccessException } from '../auth/agent-auth.errors';
import { AgentPolicyService } from '../policy/agent-policy.service';
import { readOptionalString, readRequiredString } from './agent-capability.input';
import { AgentTaskAccess } from './agent-task-access';
import { taskPolicyTarget } from './agent-scope-target';

@Injectable()
export class AgentDriveHandler {
  constructor(
    private readonly policy: AgentPolicyService,
    private readonly access: AgentTaskAccess,
    private readonly artifacts: DriveTaskArtifactService,
  ) {}

  async readTaskArtifact(agent: AuthenticatedAgent, input: Record<string, unknown>) {
    const taskId = readRequiredString(input, 'taskId');
    const fileAssetId = readOptionalString(input, 'fileAssetId');
    const { task, workspace } = await this.access.requireAuthorizedTask(
      agent,
      'drive.read_task_artifact',
      taskId,
      'INTERNAL',
    );
    if (!fileAssetId) {
      return this.listVisible(task.id);
    }
    return this.readOne(agent, task.id, fileAssetId, workspace);
  }

  async attachArtifact(
    agent: AuthenticatedAgent,
    input: Record<string, unknown>,
    bytes: Uint8Array,
  ) {
    const { task } = await this.access.requireAuthorizedTask(
      agent,
      'tasks.attach_artifact',
      readRequiredString(input, 'taskId'),
      'INTERNAL',
    );
    return this.artifacts.createAndLinkTaskArtifact({
      taskId: task.id,
      fileName: readRequiredString(input, 'fileName'),
      mimeType: readRequiredString(input, 'mimeType'),
      sizeBytes: readSizeBytes(input),
      content: bytes,
    });
  }

  private async listVisible(taskId: string) {
    const items = await this.artifacts.listLinkedTaskArtifacts(taskId);
    return items
      .filter((item) => !item.forbiddenToAgents && item.dataClassification === 'INTERNAL')
      .map((item) => ({
        id: item.id,
        name: item.name,
        mimeType: item.mimeType,
        sizeBytes: item.sizeBytes,
        confidentiality: item.dataClassification,
      }));
  }

  private async readOne(
    agent: AuthenticatedAgent,
    taskId: string,
    fileAssetId: string,
    workspace: CanonicalWorkSpace,
  ) {
    const artifact = await this.loadLinkedArtifact(taskId, fileAssetId);
    if (artifact.forbiddenToAgents) {
      throw AgentAccessException.resourceNotAvailable();
    }
    await this.policy.assertAllowed({
      actor: agent.actor,
      agentState: agent.agentState,
      credentialState: agent.credentialState,
      capabilityKey: 'drive.read_task_artifact',
      target: taskPolicyTarget(workspace, taskId),
      targetDataClassification: artifact.dataClassification,
    });
    if (artifact.dataClassification !== 'INTERNAL') {
      throw AgentAccessException.resourceNotAvailable();
    }
    const withUrl = await this.loadLinkedArtifactView(taskId, fileAssetId);
    return {
      id: withUrl.id,
      name: withUrl.name,
      mimeType: withUrl.mimeType,
      sizeBytes: withUrl.sizeBytes,
      confidentiality: withUrl.dataClassification,
      viewUrl: withUrl.viewUrl,
    };
  }

  private async loadLinkedArtifact(taskId: string, fileAssetId: string) {
    try {
      const artifact = await this.artifacts.getLinkedTaskArtifact(taskId, fileAssetId);
      if (isDriveConfidentialityForbiddenToAgents(artifact.confidentiality)) {
        throw AgentAccessException.resourceNotAvailable();
      }
      return artifact;
    } catch (error) {
      throw notAvailableOrRethrow(error);
    }
  }

  private async loadLinkedArtifactView(taskId: string, fileAssetId: string) {
    try {
      return await this.artifacts.getLinkedTaskArtifactView(taskId, fileAssetId);
    } catch (error) {
      throw notAvailableOrRethrow(error);
    }
  }
}

function readSizeBytes(input: Record<string, unknown>): number {
  const value = input.sizeBytes;
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw AgentAccessException.validationFailed('sizeBytes must be a non-negative number');
  }
  return parsed;
}

function notAvailableOrRethrow(error: unknown): AgentAccessException {
  if (error instanceof AgentAccessException) return error;
  if (error instanceof NotFoundException) {
    return AgentAccessException.resourceNotAvailable();
  }
  throw error;
}
