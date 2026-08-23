import { describe, expect, it } from 'vitest';
import {
  canTransitionArtifactStatus,
  decideArtifactRecoveryTarget,
} from './drive-artifact-operation.state';

describe('artifact operation state machine', () => {
  it('allows the happy-path forward transitions', () => {
    expect(canTransitionArtifactStatus('PREPARED', 'UPLOAD_PENDING')).toBe(true);
    expect(canTransitionArtifactStatus('UPLOAD_PENDING', 'OBJECT_UPLOADED')).toBe(true);
    expect(canTransitionArtifactStatus('OBJECT_UPLOADED', 'OBJECT_VERIFIED')).toBe(true);
    expect(canTransitionArtifactStatus('OBJECT_VERIFIED', 'COMPLETED')).toBe(true);
  });

  it('rejects skipping FileAsset finalization or leaving COMPLETED', () => {
    expect(canTransitionArtifactStatus('PREPARED', 'OBJECT_UPLOADED')).toBe(true);
    expect(canTransitionArtifactStatus('PREPARED', 'COMPLETED')).toBe(false);
    expect(canTransitionArtifactStatus('COMPLETED', 'UPLOAD_PENDING')).toBe(false);
  });

  it('recovers object-uploaded-before-DB as OBJECT_UPLOADED', () => {
    expect(
      decideArtifactRecoveryTarget({
        status: 'UPLOAD_PENDING',
        objectExists: true,
        fileAssetId: null,
        fileVersionId: null,
        fileLinkId: null,
        expired: false,
      }),
    ).toBe('OBJECT_UPLOADED');
  });

  it('completes from an existing FileAsset after DB-link-before-operation-completion', () => {
    expect(
      decideArtifactRecoveryTarget({
        status: 'OBJECT_VERIFIED',
        objectExists: true,
        fileAssetId: 'file-1',
        fileVersionId: 'ver-1',
        fileLinkId: 'link-1',
        expired: false,
      }),
    ).toBe('COMPLETED');
  });

  it('does not treat a missing object after verification as completed', () => {
    expect(
      decideArtifactRecoveryTarget({
        status: 'OBJECT_VERIFIED',
        objectExists: false,
        fileAssetId: null,
        fileVersionId: null,
        fileLinkId: null,
        expired: false,
      }),
    ).toBe('FAILED_RETRYABLE');
  });

  it('expires only when nothing was uploaded and the TTL elapsed', () => {
    expect(
      decideArtifactRecoveryTarget({
        status: 'UPLOAD_PENDING',
        objectExists: false,
        fileAssetId: null,
        fileVersionId: null,
        fileLinkId: null,
        expired: true,
      }),
    ).toBe('EXPIRED');
  });
});
