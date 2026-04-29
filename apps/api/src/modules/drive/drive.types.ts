export interface FileEntry {
  key: string;
  name: string;
  size: number;
  lastModified: Date | undefined;
  isFolder: boolean;
}

export interface FolderNode {
  name: string;
  path: string;
  children: FolderNode[];
  files: FileEntry[];
}

export interface CreateFileAssetDto {
  displayName: string;
  originalName?: string;
  fileType?: string;
  purpose?: string;
  sourceModule?: string;
  ownerId?: string;
  createdById?: string;
  visibility?: string;
  confidentiality?: string;
  storageKey?: string;
  externalUrl?: string;
  mimeType?: string;
  sizeBytes?: number;
  checksum?: string;
  link?: CreateFileLinkDto;
}

export interface CreateFileLinkDto {
  entityType: string;
  entityId: string;
  linkType?: string;
  purposeOverride?: string;
  isPrimary?: boolean;
  linkedById?: string;
}

export interface FileAssetQueryParams {
  entityType?: string;
  entityId?: string;
  purpose?: string;
  status?: string;
  sourceModule?: string;
  search?: string;
}
