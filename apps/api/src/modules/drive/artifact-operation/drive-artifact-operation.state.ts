import type { ArtifactOperationStatus } from './drive-artifact-operation.types';
import { ARTIFACT_OPERATION_TERMINAL_STATUSES } from './drive-artifact-operation.constants';

export const ARTIFACT_STATUS_ORDER: readonly ArtifactOperationStatus[] = [
  'PREPARED',
  'UPLOAD_PENDING',
  'OBJECT_UPLOADED',
  'OBJECT_VERIFIED',
  'COMPLETED',
];

const FORWARD_EDGES: Readonly<Record<ArtifactOperationStatus, readonly ArtifactOperationStatus[]>> =
  {
    PREPARED: [
      'UPLOAD_PENDING',
      'OBJECT_UPLOADED',
      'OBJECT_VERIFIED',
      'FAILED_RETRYABLE',
      'FAILED',
      'CANCELLED',
      'EXPIRED',
    ],
    UPLOAD_PENDING: [
      'OBJECT_UPLOADED',
      'OBJECT_VERIFIED',
      'FAILED_RETRYABLE',
      'FAILED',
      'CANCELLED',
      'EXPIRED',
    ],
    OBJECT_UPLOADED: ['OBJECT_VERIFIED', 'FAILED_RETRYABLE', 'FAILED', 'CANCELLED'],
    OBJECT_VERIFIED: ['COMPLETED', 'FAILED_RETRYABLE', 'FAILED', 'CANCELLED'],
    COMPLETED: [],
    FAILED_RETRYABLE: [
      'UPLOAD_PENDING',
      'OBJECT_UPLOADED',
      'OBJECT_VERIFIED',
      'FAILED',
      'CANCELLED',
      'EXPIRED',
    ],
    FAILED: [],
    CANCELLED: [],
    EXPIRED: [],
  };

export function isTerminalArtifactStatus(status: ArtifactOperationStatus): boolean {
  return (ARTIFACT_OPERATION_TERMINAL_STATUSES as readonly string[]).includes(status);
}

export function canTransitionArtifactStatus(
  from: ArtifactOperationStatus,
  to: ArtifactOperationStatus,
): boolean {
  if (from === to) return true;
  return FORWARD_EDGES[from].includes(to);
}

export function assertArtifactTransition(
  from: ArtifactOperationStatus,
  to: ArtifactOperationStatus,
): void {
  if (!canTransitionArtifactStatus(from, to)) {
    throw new Error(`Illegal artifact operation transition ${from} → ${to}`);
  }
}

/**
 * Recovery chooses the next durable status from the operation row plus live
 * R2/DB facts. Object existence never authorizes FileAsset creation.
 */
export function decideArtifactRecoveryTarget(input: {
  status: ArtifactOperationStatus;
  objectExists: boolean;
  fileAssetId: string | null;
  fileVersionId: string | null;
  fileLinkId: string | null;
  expired: boolean;
}): ArtifactOperationStatus {
  if (input.status === 'COMPLETED') return 'COMPLETED';
  if (input.status === 'FAILED' || input.status === 'CANCELLED') return input.status;
  if (input.fileAssetId) return 'COMPLETED';
  if (input.expired && !input.objectExists && !input.fileAssetId) {
    return input.status === 'EXPIRED' ? 'EXPIRED' : 'EXPIRED';
  }
  if (input.objectExists && input.status !== 'OBJECT_VERIFIED') {
    if (input.status === 'PREPARED' || input.status === 'UPLOAD_PENDING') {
      return 'OBJECT_UPLOADED';
    }
    if (input.status === 'FAILED_RETRYABLE') return 'OBJECT_UPLOADED';
  }
  if (!input.objectExists && input.status === 'OBJECT_VERIFIED') {
    return 'FAILED_RETRYABLE';
  }
  if (!input.objectExists && input.status === 'OBJECT_UPLOADED') {
    return 'FAILED_RETRYABLE';
  }
  return input.status;
}
