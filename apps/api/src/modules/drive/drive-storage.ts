import { type _Object } from '@aws-sdk/client-s3';
import type { FileEntry, FolderNode } from './drive.types';

export const R2_DRIVE_PREFIX = 'Drive/';

export function buildProjectPrefix(projectId: string, prefix?: string): string {
  const base = `${R2_DRIVE_PREFIX}projects/${projectId}/`;
  return prefix ? `${base}${prefix}` : base;
}

export function resolveProjectStorageKey(projectId: string, filePath: string): string {
  const withProject = `projects/${projectId}/`;
  const fullPrefix = `${R2_DRIVE_PREFIX}${withProject}`;
  if (filePath.startsWith(fullPrefix)) return filePath;
  if (filePath.startsWith(withProject)) return R2_DRIVE_PREFIX + filePath;
  return `${fullPrefix}${filePath}`;
}

export function mapS3Object(obj: _Object): FileEntry {
  return {
    key: obj.Key!,
    name: extractName(obj.Key!, false),
    size: obj.Size ?? 0,
    lastModified: obj.LastModified,
    isFolder: false,
  };
}

export function mapS3Folder(prefix: string): FileEntry {
  return {
    key: prefix,
    name: extractName(prefix, true),
    size: 0,
    lastModified: undefined,
    isFolder: true,
  };
}

export function insertIntoTree(root: FolderNode, relativePath: string, obj: _Object): void {
  const parts = relativePath.split('/').filter(Boolean);
  let current = root;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]!;
    let child = current.children.find((item) => item.name === part);
    if (!child) {
      child = { name: part, path: `${current.path}${part}/`, children: [], files: [] };
      current.children.push(child);
    }
    current = child;
  }

  current.files.push(mapS3Object(obj));
}

function extractName(key: string, isFolder: boolean): string {
  const trimmed = isFolder ? key.slice(0, -1) : key;
  return trimmed.split('/').pop() ?? trimmed;
}
