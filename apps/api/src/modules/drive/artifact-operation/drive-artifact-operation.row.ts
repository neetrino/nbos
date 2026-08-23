import type {
  FileArtifactOperationIngressEnum,
  FileArtifactOperationKindEnum,
  FileArtifactOperationSourceEnum,
  FileArtifactOperationStatusEnum,
  FileConfidentialityEnum,
  FileLinkTypeEnum,
  FilePurposeEnum,
  FileVisibilityEnum,
} from '@nbos/database';

/** Persisted FileArtifactOperation row. Avoids Prisma model-name export mismatch. */
export interface ArtifactOperationRow {
  id: string;
  status: FileArtifactOperationStatusEnum;
  source: FileArtifactOperationSourceEnum;
  ingress: FileArtifactOperationIngressEnum;
  kind: FileArtifactOperationKindEnum;
  storageKey: string;
  entityType: string;
  entityId: string;
  targetFileAssetId: string | null;
  displayName: string;
  originalName: string | null;
  mimeType: string | null;
  purpose: FilePurposeEnum | null;
  sourceModule: string | null;
  visibility: FileVisibilityEnum;
  confidentiality: FileConfidentialityEnum;
  linkType: FileLinkTypeEnum;
  expectedSizeBytes: bigint | null;
  checksum: string | null;
  payloadFingerprint: string | null;
  createdByEmployeeId: string | null;
  actorType: string;
  actorId: string;
  agentId: string | null;
  correlationId: string | null;
  idempotencyKey: string | null;
  folderId: string | null;
  fileAssetId: string | null;
  fileVersionId: string | null;
  fileLinkId: string | null;
  objectVerifiedAt: Date | null;
  expiresAt: Date;
  failedReason: string | null;
  recoveryAttemptCount: number;
  lastRecoveryAt: Date | null;
}
