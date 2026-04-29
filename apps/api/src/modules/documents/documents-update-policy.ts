import type { DocumentStatusEnum } from '@nbos/database';
import type { UpdateDocumentDto } from './documents.types';

export function shouldSkipDocumentsUpdateActivityAfterPatch(
  existing: { status: DocumentStatusEnum },
  dto: UpdateDocumentDto,
): boolean {
  const publishing = dto.status === 'PUBLISHED' && existing.status === 'DRAFT';
  if (publishing) return false;
  if (dto.recordActivity !== false) return false;
  return isDocumentsContentOnlyPatch(dto);
}

export function isDocumentsContentOnlyPatch(dto: UpdateDocumentDto): boolean {
  if (dto.listScopeOverride !== undefined) return false;
  const touchesContent =
    dto.contentJson !== undefined || dto.contentHtml !== undefined || dto.plainText !== undefined;
  if (!touchesContent) return false;
  return (
    dto.title === undefined &&
    dto.description === undefined &&
    dto.sectionId === undefined &&
    dto.status === undefined
  );
}

export function isDocumentsListScopeOnlyPatch(dto: UpdateDocumentDto): boolean {
  const entries = Object.entries(dto).filter(
    ([key, value]) => key !== 'recordActivity' && value !== undefined,
  );
  return entries.length === 1 && entries[0]![0] === 'listScopeOverride';
}
