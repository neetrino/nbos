import { randomUUID } from 'node:crypto';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@nbos/database';
import type { AiDataClassification } from '@nbos/shared';
import { PRISMA_TOKEN } from '../../database.module';
import { allowArtifactAuth } from './artifact-operation/drive-artifact-auth.ports';
import { DriveArtifactOperationService } from './artifact-operation/drive-artifact-operation.service';
import type {
  ArtifactAuthorizationPort,
  ArtifactOperationResult,
  ArtifactOperationSource,
} from './artifact-operation/drive-artifact-operation.types';
import {
  isDriveConfidentialityForbiddenToAgents,
  mapDriveConfidentialityToAi,
} from './drive-ai-classification';
import { DriveService } from './drive.service';
import { readTenantOrganizationId } from './drive-tenant';
import { buildStorageHomeKey } from './drive-storage-home-path';
import { purposeSubfolder } from './drive-storage-home-purpose';
import { sanitizeUploadBaseName } from './drive-upload-path';
import {
  assertUploadFileNameAllowed,
  assertUploadSizeWithinLimit,
} from './drive-upload-validation';

export const DRIVE_AGENT_SOURCE_MODULE = 'AI_PLATFORM';

export interface DriveTaskArtifactView {
  id: string;
  name: string;
  mimeType: string | null;
  sizeBytes: number | null;
  confidentiality: string;
  dataClassification: AiDataClassification;
  forbiddenToAgents: boolean;
  viewUrl?: string;
}

export interface CreateAgentTaskArtifactInput {
  taskId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  content: Uint8Array;
  source?: ArtifactOperationSource;
  actorType?: string;
  actorId?: string;
  agentId?: string;
  createdByEmployeeId?: string;
  idempotencyKey?: string;
  correlationId?: string;
  payloadFingerprint?: string;
  auth?: ArtifactAuthorizationPort;
}

/**
 * Task-linked Drive artifacts for AI actors. Prisma stays in Drive; the AI
 * gateway never writes FileAsset / FileLink rows itself.
 */
@Injectable()
export class DriveTaskArtifactService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly drive: DriveService,
    private readonly artifacts: DriveArtifactOperationService,
    private readonly config: ConfigService,
  ) {}

  async listLinkedTaskArtifacts(taskId: string): Promise<DriveTaskArtifactView[]> {
    const links = await this.loadActiveTaskLinks(taskId);
    return links.map((link) => toArtifactView(link.fileAsset));
  }

  async getLinkedTaskArtifact(taskId: string, fileAssetId: string): Promise<DriveTaskArtifactView> {
    const file = await this.requireLinkedAsset(taskId, fileAssetId);
    return toArtifactView(file);
  }

  async getLinkedTaskArtifactView(
    taskId: string,
    fileAssetId: string,
  ): Promise<DriveTaskArtifactView> {
    const file = await this.requireLinkedAsset(taskId, fileAssetId);
    if (isDriveConfidentialityForbiddenToAgents(file.confidentiality)) {
      throw new NotFoundException(`File asset ${fileAssetId} not found`);
    }
    const preview = await this.drive.getAssetViewUrl(fileAssetId);
    return { ...toArtifactView(file), viewUrl: preview.url };
  }

  async createAndLinkTaskArtifact(
    input: CreateAgentTaskArtifactInput,
  ): Promise<{ fileAssetId: string; linkId: string }> {
    const prepared = validateAgentArtifactInput(input);
    const source = input.source ?? 'EXTERNAL_AI';
    const actorId = input.actorId ?? input.agentId ?? 'external-agent';
    const fingerprint = input.payloadFingerprint ?? this.artifacts.fingerprintBytes(input.content);
    const operation = await this.artifacts.prepare({
      source,
      ingress: 'MACHINE_PUT',
      kind: 'CREATE_ASSET',
      storageKey: this.buildTaskStorageKey(input.taskId, prepared.fileName),
      entityType: 'TASK',
      entityId: input.taskId,
      displayName: prepared.fileName,
      originalName: prepared.fileName,
      mimeType: prepared.mimeType,
      purpose: 'TASK_ATTACHMENT',
      sourceModule: DRIVE_AGENT_SOURCE_MODULE,
      confidentiality: 'CONFIDENTIAL',
      visibility: 'INTERNAL',
      linkType: 'TASK_ATTACHMENT',
      expectedSizeBytes: prepared.sizeBytes,
      checksum: fingerprint,
      payloadFingerprint: fingerprint,
      actorType: input.actorType ?? source,
      actorId,
      agentId: input.agentId ?? undefined,
      createdByEmployeeId: input.createdByEmployeeId,
      idempotencyKey: input.idempotencyKey,
      correlationId: input.correlationId,
    });
    const result = await this.artifacts.executeMachineUpload(
      operation.id,
      input.content,
      input.auth ?? allowArtifactAuth(),
    );
    return toAttachResult(result);
  }

  private buildTaskStorageKey(taskId: string, fileName: string): string {
    const orgId = readTenantOrganizationId(this.config);
    return buildStorageHomeKey(
      orgId,
      `tasks/${taskId}/${purposeSubfolder('TASK_ATTACHMENT')}`,
      `${randomUUID()}-${fileName}`,
    );
  }

  private async loadActiveTaskLinks(taskId: string) {
    return this.prisma.fileLink.findMany({
      where: {
        entityType: 'TASK',
        entityId: taskId,
        unlinkedAt: null,
        linkType: 'TASK_ATTACHMENT',
        fileAsset: { deletedAt: null },
      },
      include: { fileAsset: true },
      orderBy: { linkedAt: 'asc' },
    });
  }

  private async requireLinkedAsset(taskId: string, fileAssetId: string) {
    const link = await this.prisma.fileLink.findFirst({
      where: {
        entityType: 'TASK',
        entityId: taskId,
        fileAssetId,
        unlinkedAt: null,
        linkType: 'TASK_ATTACHMENT',
        fileAsset: { deletedAt: null },
      },
      include: { fileAsset: true },
    });
    if (!link) {
      throw new NotFoundException(`File asset ${fileAssetId} not found`);
    }
    return link.fileAsset;
  }
}

function toArtifactView(file: {
  id: string;
  displayName: string;
  mimeType: string | null;
  sizeBytes: bigint | number | null;
  confidentiality: string;
}): DriveTaskArtifactView {
  return {
    id: file.id,
    name: file.displayName,
    mimeType: file.mimeType,
    sizeBytes: toNumberOrNull(file.sizeBytes),
    confidentiality: file.confidentiality,
    dataClassification: mapDriveConfidentialityToAi(file.confidentiality),
    forbiddenToAgents: isDriveConfidentialityForbiddenToAgents(file.confidentiality),
  };
}

function toNumberOrNull(value: bigint | number | null): number | null {
  if (value === null) return null;
  return typeof value === 'bigint' ? Number(value) : value;
}

function requireMimeType(value: string): string {
  const mimeType = value.trim();
  if (!mimeType) {
    throw new BadRequestException('mimeType is required');
  }
  return mimeType;
}

function validateAgentArtifactInput(input: CreateAgentTaskArtifactInput): {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
} {
  const fileName = sanitizeUploadBaseName(input.fileName);
  assertUploadFileNameAllowed(fileName);
  assertUploadSizeWithinLimit(input.content.byteLength);
  assertUploadSizeWithinLimit(input.sizeBytes);
  if (input.sizeBytes !== input.content.byteLength) {
    throw new BadRequestException('sizeBytes does not match the uploaded content.');
  }
  return { fileName, mimeType: requireMimeType(input.mimeType), sizeBytes: input.sizeBytes };
}

function toAttachResult(result: ArtifactOperationResult): { fileAssetId: string; linkId: string } {
  return { fileAssetId: result.fileAssetId, linkId: result.fileLinkId ?? result.fileAssetId };
}
