import { describe, expect, it } from 'vitest';
import {
  evaluateDriveFileAction,
  type DriveFileActorCapabilities,
  type DriveFileActionFileSnapshot,
} from './drive-file-action-policy';

function cap(
  partial: Partial<DriveFileActorCapabilities> & Pick<DriveFileActorCapabilities, 'employeeId'>,
): DriveFileActorCapabilities {
  return {
    isOrigin: false,
    hasBaseAccess: false,
    grantPermissions: new Set(),
    ...partial,
  };
}

const baseFile: DriveFileActionFileSnapshot = {
  visibility: 'INTERNAL',
  confidentiality: 'CONFIDENTIAL',
  status: 'ACTIVE',
  activeBusinessLinkCount: 0,
};

describe('evaluateDriveFileAction', () => {
  it('denies grant-only viewer from copying', () => {
    const decision = evaluateDriveFileAction(
      cap({ employeeId: 'e1', grantPermissions: new Set(['VIEW']) }),
      'COPY',
      baseFile,
    );
    expect(decision.allowed).toBe(false);
  });

  it('allows owner to copy when constraints pass', () => {
    const decision = evaluateDriveFileAction(
      cap({ employeeId: 'e1', isOrigin: true }),
      'COPY',
      baseFile,
    );
    expect(decision.allowed).toBe(true);
  });

  it('blocks finance-sensitive copy even for owner', () => {
    const decision = evaluateDriveFileAction(cap({ employeeId: 'e1', isOrigin: true }), 'COPY', {
      ...baseFile,
      confidentiality: 'FINANCE_SENSITIVE',
    });
    expect(decision.allowed).toBe(false);
  });

  it('requires finance link tier is not COPY — blocks copy into personal with business links', () => {
    const decision = evaluateDriveFileAction(cap({ employeeId: 'e1', isOrigin: true }), 'COPY', {
      ...baseFile,
      activeBusinessLinkCount: 2,
      targetFolderSpace: 'PERSONAL',
    });
    expect(decision.allowed).toBe(false);
  });

  it('allows base-access participant to share non-restricted files', () => {
    const decision = evaluateDriveFileAction(
      cap({ employeeId: 'e1', hasBaseAccess: true }),
      'SHARE',
      baseFile,
    );
    expect(decision.allowed).toBe(true);
  });

  it('denies view-only grant from move placement', () => {
    const decision = evaluateDriveFileAction(
      cap({ employeeId: 'e1', grantPermissions: new Set(['VIEW']) }),
      'MOVE_PLACEMENT',
      baseFile,
    );
    expect(decision.allowed).toBe(false);
  });

  it('allows DELETE grant to archive', () => {
    const decision = evaluateDriveFileAction(
      cap({ employeeId: 'e1', grantPermissions: new Set(['DELETE']) }),
      'ARCHIVE',
      baseFile,
    );
    expect(decision.allowed).toBe(true);
  });

  it('blocks trash when active business links remain', () => {
    const decision = evaluateDriveFileAction(cap({ employeeId: 'e1', isOrigin: true }), 'TRASH', {
      ...baseFile,
      activeBusinessLinkCount: 2,
    });
    expect(decision.allowed).toBe(false);
  });

  it('allows owner to move active file to trash', () => {
    const decision = evaluateDriveFileAction(
      cap({ employeeId: 'e1', isOrigin: true }),
      'TRASH',
      baseFile,
    );
    expect(decision.allowed).toBe(true);
  });

  it('blocks trash when file is already deleted', () => {
    const decision = evaluateDriveFileAction(cap({ employeeId: 'e1', isOrigin: true }), 'TRASH', {
      ...baseFile,
      status: 'DELETED',
    });
    expect(decision.allowed).toBe(false);
  });

  it('allows owner to restore deleted trash file', () => {
    const decision = evaluateDriveFileAction(cap({ employeeId: 'e1', isOrigin: true }), 'RESTORE', {
      ...baseFile,
      status: 'DELETED',
    });
    expect(decision.allowed).toBe(true);
  });
});
