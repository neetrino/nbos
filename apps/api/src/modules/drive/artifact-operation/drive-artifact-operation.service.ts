import { createHash, randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import type { ArtifactOperationRow } from './drive-artifact-operation.row';
import { PRISMA_TOKEN } from '../../../database.module';
import { FILE_ASSET_INCLUDE } from '../drive-file-asset-include';
import { jsonSafeForHttp } from '../drive-json-safe';
import { DriveArtifactStorageAdapter } from './drive-artifact-storage.adapter';
import { finalizeArtifactOperationInTx } from './drive-artifact-finalizer';
import {
  assertSameArtifactFingerprint,
  assertSameArtifactTarget,
  recoverPrepareConflict,
  requireArtifactResult,
  toArtifactAuthContext,
} from './drive-artifact-operation.helpers';
import { toArtifactCreateData } from './drive-artifact-operation.mapper';
import {
  advanceArtifactStatus,
  findActiveArtifactByStorageKey,
  findArtifactByIdempotency,
  findArtifactByStorageKey,
  findArtifactOperation,
} from './drive-artifact-operation.repository';
import type {
  ArtifactAuthorizationPort,
  ArtifactOperationResult,
  DriveArtifactStorage,
  FinalizeHints,
  PrepareArtifactOperationInput,
} from './drive-artifact-operation.types';
import { verifyArtifactObject } from './drive-artifact-verify.ops';
import { decideArtifactRecoveryTarget } from './drive-artifact-operation.state';
import { ARTIFACT_OPERATION_MAX_RECOVERY_ATTEMPTS } from './drive-artifact-operation.constants';

@Injectable()
export class DriveArtifactOperationService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly storageAdapter: DriveArtifactStorageAdapter,
  ) {}

  async prepare(input: PrepareArtifactOperationInput): Promise<ArtifactOperationRow> {
    if (input.idempotencyKey) {
      const existing = await findArtifactByIdempotency(this.prisma, {
        source: input.source,
        actorId: input.actorId,
        idempotencyKey: input.idempotencyKey,
      });
      if (existing) {
        assertSameArtifactFingerprint(existing, input.payloadFingerprint);
        assertSameArtifactTarget(existing, input);
        return existing;
      }
    }
    const byKey = await findArtifactByStorageKey(this.prisma, input.storageKey);
    if (byKey) {
      assertSameArtifactFingerprint(byKey, input.payloadFingerprint);
      assertSameArtifactTarget(byKey, input);
      return byKey;
    }
    try {
      return await this.prisma.fileArtifactOperation.create({
        data: toArtifactCreateData({ ...input, id: input.id ?? randomUUID() }),
      });
    } catch (error) {
      return recoverPrepareConflict(this.prisma, input, error);
    }
  }

  async executeMachineUpload(
    operationId: string,
    content: Uint8Array,
    auth: ArtifactAuthorizationPort,
    storage: DriveArtifactStorage = this.storageAdapter,
  ): Promise<ArtifactOperationResult> {
    const operation = await this.require(operationId);
    await auth.assertCanFinalize(toArtifactAuthContext(operation));
    if (operation.status === 'COMPLETED') return requireArtifactResult(operation);
    await this.putIfNeeded(operation, content, storage);
    return this.verifyAndFinalize(operation.id, {}, auth, storage);
  }

  async finalizeAfterObjectPresent(
    operationId: string,
    hints: FinalizeHints,
    auth: ArtifactAuthorizationPort,
    storage: DriveArtifactStorage = this.storageAdapter,
  ): Promise<ArtifactOperationResult> {
    return this.verifyAndFinalize(operationId, hints, auth, storage);
  }

  async recover(
    operationId: string,
    auth: ArtifactAuthorizationPort,
    storage: DriveArtifactStorage = this.storageAdapter,
    hints: FinalizeHints = {},
  ): Promise<ArtifactOperationResult | ArtifactOperationRow> {
    const operation = await this.require(operationId);
    await auth.assertCanFinalize(toArtifactAuthContext(operation));
    if (operation.status === 'COMPLETED') return requireArtifactResult(operation);
    const head = await storage.headObject(operation.storageKey);
    const asset = await this.lookupLinkedAsset(operation);
    const next = decideArtifactRecoveryTarget({
      status: operation.status,
      objectExists: Boolean(head),
      fileAssetId: asset?.fileAssetId ?? operation.fileAssetId,
      fileVersionId: operation.fileVersionId,
      fileLinkId: operation.fileLinkId,
      expired: operation.expiresAt.getTime() < Date.now(),
    });
    await this.bumpRecovery(operation);
    if (next === 'EXPIRED') {
      return advanceArtifactStatus(this.prisma, operation, 'EXPIRED', {
        failedReason: 'session_expired',
      });
    }
    if (next === 'FAILED_RETRYABLE' && !head) {
      return advanceArtifactStatus(this.prisma, operation, 'FAILED_RETRYABLE', {
        failedReason: 'storage_object_missing',
      });
    }
    if (asset) return this.completeFromExistingAsset(operation, asset);
    if (head) return this.verifyAndFinalize(operation.id, hints, auth, storage);
    return this.require(operationId);
  }

  async findById(id: string): Promise<ArtifactOperationRow | null> {
    return findArtifactOperation(this.prisma, id);
  }

  async findByStorageKey(storageKey: string): Promise<ArtifactOperationRow | null> {
    return findActiveArtifactByStorageKey(this.prisma, storageKey);
  }

  async loadCompletedFile(fileAssetId: string) {
    const file = await this.prisma.fileAsset.findUnique({
      where: { id: fileAssetId },
      include: FILE_ASSET_INCLUDE,
    });
    if (!file) throw new NotFoundException(`File asset ${fileAssetId} not found`);
    return jsonSafeForHttp(file);
  }

  async markFailed(operationId: string, reason: string, retryable: boolean): Promise<void> {
    const operation = await this.require(operationId);
    await advanceArtifactStatus(this.prisma, operation, retryable ? 'FAILED_RETRYABLE' : 'FAILED', {
      failedReason: reason.slice(0, 500),
    });
  }

  async markCancelled(operationId: string, reason: string): Promise<void> {
    const operation = await this.require(operationId);
    if (operation.status === 'COMPLETED') return;
    await advanceArtifactStatus(this.prisma, operation, 'CANCELLED', {
      failedReason: reason.slice(0, 500),
    });
  }

  fingerprintBytes(bytes: Uint8Array): string {
    return createHash('sha256').update(Buffer.from(bytes)).digest('hex');
  }

  private async verifyAndFinalize(
    operationId: string,
    hints: FinalizeHints,
    auth: ArtifactAuthorizationPort,
    storage: DriveArtifactStorage,
  ): Promise<ArtifactOperationResult> {
    const operation = await this.require(operationId);
    await auth.assertCanFinalize(toArtifactAuthContext(operation));
    if (operation.status === 'COMPLETED') return requireArtifactResult(operation);
    const head = await storage.headObject(operation.storageKey);
    if (
      operation.expiresAt.getTime() < Date.now() &&
      operation.status !== 'OBJECT_VERIFIED' &&
      !head
    ) {
      await advanceArtifactStatus(this.prisma, operation, 'EXPIRED', {
        failedReason: 'session_expired',
      });
      throw new BadRequestException('Upload session has expired.');
    }
    let verified: ReturnType<typeof verifyArtifactObject>;
    try {
      verified = verifyArtifactObject(operation, head, hints);
    } catch (error) {
      await this.markVerifyFailure(operation, error);
      throw error;
    }
    const ready = await advanceArtifactStatus(this.prisma, operation, 'OBJECT_VERIFIED', {
      objectVerifiedAt: new Date(),
      checksum: verified.checksum,
      expectedSizeBytes: BigInt(verified.sizeBytes),
    });
    return this.commitFinalization(ready, verified);
  }

  private async commitFinalization(
    operation: ArtifactOperationRow,
    verified: { sizeBytes: number; checksum: string | null },
  ): Promise<ArtifactOperationResult> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM file_artifact_operations WHERE id = ${operation.id} FOR UPDATE`;
      const fresh = await tx.fileArtifactOperation.findUnique({ where: { id: operation.id } });
      if (!fresh) throw new NotFoundException(`Artifact operation ${operation.id} not found`);
      if (fresh.status === 'COMPLETED') return requireArtifactResult(fresh);
      return finalizeArtifactOperationInTx(tx, fresh, verified);
    });
  }

  private async putIfNeeded(
    operation: ArtifactOperationRow,
    content: Uint8Array,
    storage: DriveArtifactStorage,
  ): Promise<void> {
    if (operation.status === 'OBJECT_VERIFIED' || operation.status === 'OBJECT_UPLOADED') {
      return;
    }
    const existing = await storage.headObject(operation.storageKey);
    if (!existing) {
      await storage.putObject(
        operation.storageKey,
        content,
        operation.mimeType ?? 'application/octet-stream',
      );
    }
    await advanceArtifactStatus(this.prisma, operation, 'OBJECT_UPLOADED');
  }

  private async require(id: string): Promise<ArtifactOperationRow> {
    const row = await findArtifactOperation(this.prisma, id);
    if (!row) throw new NotFoundException(`Artifact operation ${id} not found`);
    return row;
  }

  private async lookupLinkedAsset(
    operation: ArtifactOperationRow,
  ): Promise<ArtifactOperationResult | null> {
    if (operation.fileAssetId) {
      return {
        fileAssetId: operation.fileAssetId,
        fileVersionId: operation.fileVersionId,
        fileLinkId: operation.fileLinkId,
      };
    }
    const byKey = await this.prisma.fileAsset.findFirst({
      where: { storageKey: operation.storageKey, deletedAt: null },
      include: { versions: true, links: { where: { unlinkedAt: null } } },
    });
    if (!byKey) return null;
    return {
      fileAssetId: byKey.id,
      fileVersionId: byKey.versions[0]?.id ?? null,
      fileLinkId: byKey.links[0]?.id ?? null,
    };
  }

  private async completeFromExistingAsset(
    operation: ArtifactOperationRow,
    asset: ArtifactOperationResult,
  ): Promise<ArtifactOperationResult> {
    await this.prisma.fileArtifactOperation.update({
      where: { id: operation.id },
      data: {
        status: 'COMPLETED',
        fileAssetId: asset.fileAssetId,
        fileVersionId: asset.fileVersionId,
        fileLinkId: asset.fileLinkId,
      },
    });
    return asset;
  }

  private async bumpRecovery(operation: ArtifactOperationRow): Promise<void> {
    const next = operation.recoveryAttemptCount + 1;
    if (next > ARTIFACT_OPERATION_MAX_RECOVERY_ATTEMPTS) {
      await advanceArtifactStatus(this.prisma, operation, 'FAILED', {
        failedReason: 'recovery_attempts_exhausted',
        recoveryAttemptCount: next,
        lastRecoveryAt: new Date(),
      });
      throw new ConflictException('Artifact operation recovery attempts exhausted.');
    }
    await this.prisma.fileArtifactOperation.update({
      where: { id: operation.id },
      data: { recoveryAttemptCount: next, lastRecoveryAt: new Date() },
    });
  }

  private async markVerifyFailure(operation: ArtifactOperationRow, error: unknown): Promise<void> {
    const message = error instanceof Error ? error.message : 'object_verification_failed';
    const retryable = message.includes('not found in storage');
    await advanceArtifactStatus(this.prisma, operation, retryable ? 'FAILED_RETRYABLE' : 'FAILED', {
      failedReason: message.slice(0, 500),
    });
  }
}
