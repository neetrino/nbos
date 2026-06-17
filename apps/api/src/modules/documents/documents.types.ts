export interface CreateDocumentDto {
  title: string;
  /** Legacy section-based location. Optional when libraryKey or driveFolderId is provided. */
  sectionId?: string;
  /** Drive library category key (deals | projects | products | clients | finance | partners | tasks | support). */
  libraryKey?: string;
  /** CRM entity type (DEAL | LEAD | PROJECT | …). Requires libraryKey; mutually exclusive with driveFolderId. */
  entityType?: string;
  /** CRM entity ID matching entityType. Requires both libraryKey and entityType. */
  entityId?: string;
  /** Real DriveFolder ID (COMPANY or PERSONAL space). Mutually exclusive with libraryKey. */
  driveFolderId?: string;
  type?: string;
  description?: string;
}

export interface UpdateDocumentDto {
  title?: string;
  description?: string | null;
  sectionId?: string;
  /** Per-document list visibility override; null clears override (section default applies). */
  listScopeOverride?: string | null;
  contentJson?: unknown;
  contentHtml?: string | null;
  plainText?: string | null;
  status?: string;
  /** When false with content-only fields, skips `DocumentActivityEvent` (e.g. autosave). */
  recordActivity?: boolean;
}

export interface ListDocumentsQuery {
  sectionId?: string;
  /** Filter by document type, e.g. 'NATIVE'. */
  type?: string;
  /** Filter by Drive library category key. */
  libraryKey?: string;
  /** Filter by CRM entity type (DEAL | LEAD | PROJECT | …). Must accompany libraryKey. */
  entityType?: string;
  /** Filter by CRM entity ID. Must accompany both libraryKey and entityType. */
  entityId?: string;
  /** Filter by real DriveFolder ID. */
  driveFolderId?: string;
  status?: string;
  search?: string;
  includeArchived?: boolean;
}

export interface CreateDocumentTagDto {
  name: string;
  color?: string;
}

export interface CreateDocumentSectionDto {
  name: string;
  description?: string;
  icon?: string;
}

export interface UpdateDocumentSectionDto {
  /** Section default for document list visibility (`ALL` \| `OWN` \| `DEPARTMENT`). */
  defaultListScope: string;
}

export interface AddDocumentAttachmentDto {
  fileAssetId: string;
  purpose?: string;
  sortOrder?: number;
}

export interface ExportDocumentQuery {
  format?: string;
}

export type DocumentRecentInteractionType = 'OPENED' | 'EDITED';
