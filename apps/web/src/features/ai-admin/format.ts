import { AI_ADMIN_ID_PREFIX_LENGTH } from './constants';

export function formatTimestamp(value: string | null | undefined): string {
  if (!value) {
    return 'Never';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }
  return date.toLocaleString();
}

export function shortId(id: string): string {
  return id.slice(0, AI_ADMIN_ID_PREFIX_LENGTH);
}

export function workspaceLabel(
  workspaces: Array<{ id: string; name: string }>,
  id: string,
): string {
  return workspaces.find((item) => item.id === id)?.name ?? shortId(id);
}
