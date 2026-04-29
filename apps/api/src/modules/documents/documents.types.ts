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
