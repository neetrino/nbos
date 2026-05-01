export interface CreateDocumentDto {
  title: string;
  sectionId: string;
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
  status?: string;
  search?: string;
  includeArchived?: boolean;
}

export interface CreateDocumentTagDto {
  name: string;
  color?: string;
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
