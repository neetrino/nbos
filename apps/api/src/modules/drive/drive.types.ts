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

export interface CreateGeneratedFileAssetDto extends Omit<
  CreateFileAssetDto,
  'storageKey' | 'sizeBytes'
> {
  storageKey: string;
  content: string | Uint8Array;
  contentType: string;
}

export interface CreateFileLinkDto {
  entityType: string;
  entityId: string;
  linkType?: string;
  purposeOverride?: string;
  isPrimary?: boolean;
  linkedById?: string;
}

export interface CreateFileAssetGrantDto {
  granteeEmployeeId: string;
  /** Defaults to VIEW. See `FILE_GRANT_PERMISSIONS` in drive-grant-permissions. */
  permission?: string;
}

export interface AddFolderFileDto {
  fileAssetId: string;
}

export interface FileAssetQueryParams {
  entityType?: string;
  entityId?: string;
  purpose?: string;
  status?: string;
  sourceModule?: string;
  search?: string;
  /** When true, exclude files the viewer owns as sole uploader (NBOS Shared with me). */
  sharedWithMe?: boolean;
  /** Project hub: files linked only to PROJECT shell, not Deal/Product/Task/etc. */
  projectHubProjectFiles?: boolean;
  projectId?: string;
}

export interface CreateUploadSessionDto {
  fileName: string;
  contentType: string;
  entityType?: string;
  entityId?: string;
  folderId?: string;
  displayName?: string;
  purpose?: string;
  sourceModule?: string;
  visibility?: string;
  confidentiality?: string;
  linkType?: string;
}

export interface CompleteUploadSessionDto {
  sizeBytes?: number;
  checksum?: string;
}

export interface CreateFileVersionUploadDto {
  fileName: string;
  contentType: string;
}

export interface CompleteFileVersionDto {
  storageKey: string;
  sizeBytes?: number;
  checksum?: string;
  changeNote?: string;
}

/** Snapshot of `FileUploadSession` fields needed to materialize a File Asset after R2 upload. */
export interface FileUploadSessionCompleteRow {
  displayName: string;
  originalName: string | null;
  mimeType: string | null;
  storageKey: string;
  entityType: string;
  entityId: string;
  purpose: string | null;
  sourceModule: string | null;
  visibility: string;
  confidentiality: string;
  linkType: string;
}

export interface CreateDriveFolderDto {
  name: string;
  /** Required for Company/Personal; optional when scopeEntityType + scopeEntityId are set (defaults to COMPANY). */
  space?: string;
  parentId?: string;
  scopeEntityType?: string;
  scopeEntityId?: string;
}

export interface DriveFolderQueryParams {
  space?: string;
  parentId?: string;
  scopeEntityType?: string;
  scopeEntityId?: string;
}

export interface MoveFolderFileDto {
  sourceFolderId: string;
  targetFolderId: string;
}

export interface CopyFolderFileDto {
  targetFolderId: string;
}

export interface RenameDriveFolderDto {
  name: string;
}
