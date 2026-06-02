'use client';

import { useMemo } from 'react';
import { driveApi, type FileAsset } from '@/lib/api/drive';
import { DriveAccessGrantsPanel } from './drive-access-grants-panel';

export function FileDriveGrantsSection({
  file,
  onChanged,
}: {
  file: FileAsset;
  onChanged?: () => void;
}) {
  const api = useMemo(
    () => ({
      listGrants: () => driveApi.listFileAssetGrants(file.id),
      createGrant: (body: { granteeEmployeeId: string; permission?: string }) =>
        driveApi.createFileAssetGrant(file.id, body),
      revokeGrant: (grantId: string) => driveApi.revokeFileAssetGrant(file.id, grantId),
    }),
    [file.id],
  );

  return (
    <section>
      <h3 className="text-foreground text-sm font-semibold">Manual access</h3>
      <div className="mt-2">
        <DriveAccessGrantsPanel subjectKind="file" api={api} onChanged={onChanged} />
      </div>
    </section>
  );
}
