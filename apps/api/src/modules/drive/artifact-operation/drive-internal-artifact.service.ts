import { Injectable } from '@nestjs/common';
import { DriveTaskArtifactService } from '../drive-task-artifact.service';
import { internalAgentArtifactAuth } from './drive-artifact-auth.ports';
import type { ArtifactOperationResult } from './drive-artifact-operation.types';

export interface InternalAgentArtifactAttachInput {
  agent: {
    id: string;
    name: string;
    status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'DISABLED' | 'ARCHIVED';
  };
  onBehalfOfEmployeeId?: string | null;
  taskId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  content: Uint8Array;
  idempotencyKey: string;
  correlationId?: string | null;
}

/**
 * Internal AI ingress over the same Drive Artifact Operation. Employee AI chat
 * is not enabled; this is the contract the future runtime must call.
 */
@Injectable()
export class DriveInternalArtifactService {
  constructor(private readonly artifacts: DriveTaskArtifactService) {}

  async attachTaskArtifact(
    input: InternalAgentArtifactAttachInput,
  ): Promise<ArtifactOperationResult> {
    const created = await this.artifacts.createAndLinkTaskArtifact({
      taskId: input.taskId,
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      content: input.content,
      source: 'INTERNAL_AI',
      actorType: 'INTERNAL_AI',
      actorId: input.agent.id,
      agentId: input.agent.id,
      createdByEmployeeId: input.onBehalfOfEmployeeId ?? undefined,
      idempotencyKey: input.idempotencyKey,
      correlationId: input.correlationId ?? undefined,
      auth: internalAgentArtifactAuth({ agent: input.agent }),
    });
    return {
      fileAssetId: created.fileAssetId,
      fileVersionId: null,
      fileLinkId: created.linkId,
    };
  }
}
