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

export type ArtifactOperationStatus = FileArtifactOperationStatusEnum;
export type ArtifactOperationSource = FileArtifactOperationSourceEnum;
export type ArtifactOperationKind = FileArtifactOperationKindEnum;
export type ArtifactOperationIngress = FileArtifactOperationIngressEnum;

export interface ArtifactOperationActor {
  actorType: string;
  actorId: string;
  createdByEmployeeId?: string | null;
  agentId?: string | null;
}

export interface ArtifactAuthorizationContext extends ArtifactOperationActor {
  source: ArtifactOperationSource;
  entityType: string;
  entityId: string;
  targetFileAssetId?: string | null;
  folderId?: string | null;
}

export interface ArtifactAuthorizationPort {
  assertCanPrepare(context: ArtifactAuthorizationContext): Promise<void>;
  assertCanFinalize(context: ArtifactAuthorizationContext): Promise<void>;
}

export interface PrepareArtifactOperationInput {
  id?: string;
  source: ArtifactOperationSource;
  ingress: ArtifactOperationIngress;
  kind?: ArtifactOperationKind;
  storageKey: string;
  entityType: string;
  entityId: string;
  targetFileAssetId?: string | null;
  displayName: string;
  originalName?: string | null;
  mimeType?: string | null;
  purpose?: FilePurposeEnum | string | null;
  sourceModule?: string | null;
  visibility?: FileVisibilityEnum | string | null;
  confidentiality?: FileConfidentialityEnum | string | null;
  linkType?: FileLinkTypeEnum | string | null;
  expectedSizeBytes?: number | null;
  checksum?: string | null;
  payloadFingerprint?: string | null;
  actorType: string;
  actorId: string;
  createdByEmployeeId?: string | null;
  agentId?: string | null;
  correlationId?: string | null;
  idempotencyKey?: string | null;
  folderId?: string | null;
  fileAssetId?: string | null;
  expiresAt?: Date;
}

export interface ArtifactOperationResult {
  fileAssetId: string;
  fileVersionId: string | null;
  fileLinkId: string | null;
}

export interface ArtifactObjectHead {
  contentLength: number | null;
  contentType: string | null;
}

export interface DriveArtifactStorage {
  putObject(key: string, body: Uint8Array, contentType: string): Promise<void>;
  headObject(key: string): Promise<ArtifactObjectHead | null>;
  deleteObject(key: string): Promise<void>;
}

export interface FinalizeHints {
  sizeBytes?: number | null;
  checksum?: string | null;
  changeNote?: string | null;
}
