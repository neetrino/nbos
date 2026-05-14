export function formatFileSize(value: number | string | null): string {
  if (value == null) return '-';
  const bytes = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(bytes) || bytes <= 0) return '-';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const power = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${Number((bytes / 1024 ** power).toFixed(power > 1 ? 1 : 0))} ${units[power]}`;
}

export function formatDriveDate(value: string | null | undefined): string {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDriveLabel(value: string | null | undefined): string {
  if (!value) return 'Not set';
  return value
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}

export function toFileSizeNumber(value: number | string | null): number {
  if (value == null) return 0;
  const parsed = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(parsed) ? parsed : 0;
}
