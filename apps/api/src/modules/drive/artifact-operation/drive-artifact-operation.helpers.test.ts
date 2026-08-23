import { ConflictException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import {
  assertSameArtifactFingerprint,
  assertSameArtifactTarget,
  recoverPrepareConflict,
} from './drive-artifact-operation.helpers';
import type { ArtifactOperationRow } from './drive-artifact-operation.row';
import type { PrepareArtifactOperationInput } from './drive-artifact-operation.types';

function row(overrides: Partial<ArtifactOperationRow> = {}): ArtifactOperationRow {
  return {
    id: 'op-1',
    status: 'COMPLETED',
    source: 'EXTERNAL_AI',
    ingress: 'MACHINE_PUT',
    kind: 'CREATE_ASSET',
    storageKey: 'key-1',
    entityType: 'TASK',
    entityId: 'task-1',
    targetFileAssetId: null,
    displayName: 'a.png',
    originalName: 'a.png',
    mimeType: 'image/png',
    purpose: 'TASK_ATTACHMENT',
    sourceModule: 'AI_PLATFORM',
    visibility: 'INTERNAL',
    confidentiality: 'CONFIDENTIAL',
    linkType: 'TASK_ATTACHMENT',
    expectedSizeBytes: 3n,
    checksum: 'fp',
    payloadFingerprint: 'fp',
    createdByEmployeeId: null,
    actorType: 'EXTERNAL_AI',
    actorId: 'agent-1',
    agentId: 'agent-1',
    correlationId: null,
    idempotencyKey: 'op-attach',
    folderId: null,
    fileAssetId: 'file-1',
    fileVersionId: 'ver-1',
    fileLinkId: 'link-1',
    objectVerifiedAt: new Date(),
    expiresAt: new Date(Date.now() + 60_000),
    failedReason: null,
    recoveryAttemptCount: 0,
    lastRecoveryAt: null,
    ...overrides,
  };
}

function prepareInput(
  overrides: Partial<PrepareArtifactOperationInput> = {},
): PrepareArtifactOperationInput {
  return {
    source: 'EXTERNAL_AI',
    ingress: 'MACHINE_PUT',
    storageKey: 'key-2',
    entityType: 'TASK',
    entityId: 'task-1',
    displayName: 'a.png',
    actorType: 'EXTERNAL_AI',
    actorId: 'agent-1',
    idempotencyKey: 'op-attach',
    payloadFingerprint: 'fp',
    ...overrides,
  };
}

describe('artifact operation prepare guards', () => {
  it('allows matching fingerprints and no-ops only when both sides are empty', () => {
    expect(() => assertSameArtifactFingerprint(row(), 'fp')).not.toThrow();
    expect(() =>
      assertSameArtifactFingerprint(row({ payloadFingerprint: null }), null),
    ).not.toThrow();
  });

  it('conflicts when only one side has a fingerprint', () => {
    expect(() => assertSameArtifactFingerprint(row(), null)).toThrow(ConflictException);
    expect(() => assertSameArtifactFingerprint(row({ payloadFingerprint: null }), 'fp')).toThrow(
      ConflictException,
    );
  });

  it('conflicts on a different target', () => {
    expect(() => assertSameArtifactTarget(row(), prepareInput({ entityId: 'task-b' }))).toThrow(
      ConflictException,
    );
  });

  it('recoverPrepareConflict re-checks fingerprint and original target', async () => {
    const existing = row();
    const db = {
      fileArtifactOperation: {
        findFirst: async () => existing,
        findUnique: async () => existing,
      },
    };
    await expect(
      recoverPrepareConflict(db as never, prepareInput({ payloadFingerprint: 'other' }), {
        code: 'P2002',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      recoverPrepareConflict(db as never, prepareInput({ entityId: 'task-b' }), { code: 'P2002' }),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      recoverPrepareConflict(db as never, prepareInput(), { code: 'P2002' }),
    ).resolves.toEqual(existing);
  });
});
