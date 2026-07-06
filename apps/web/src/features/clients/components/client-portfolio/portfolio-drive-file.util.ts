import { driveApi, type FileAsset } from '@/lib/api/drive';
import { getApiErrorMessage } from '@/lib/api-errors';

export function pickLatestPortfolioDriveFile(rows: FileAsset[]): FileAsset | null {
  if (rows.length === 0) return null;
  return (
    [...rows].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )[0] ?? null
  );
}

export async function loadLatestPortfolioDriveFile(params: {
  variant: 'contact' | 'company';
  entityId: string;
}): Promise<FileAsset | null> {
  const entityType = params.variant === 'contact' ? 'CONTACT' : 'COMPANY';
  const rows = await driveApi.listFileAssets({ entityType, entityId: params.entityId });
  return pickLatestPortfolioDriveFile(rows);
}

export function portfolioDriveLoadErrorMessage(err: unknown): string {
  return getApiErrorMessage(err, 'Could not load files.');
}
