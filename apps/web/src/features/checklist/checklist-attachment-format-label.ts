const MIME_TO_SHORT_LABEL: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'application/zip': 'ZIP',
  'text/plain': 'TXT',
  'text/csv': 'CSV',
  'image/jpeg': 'JPEG',
  'image/jpg': 'JPEG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
  'image/gif': 'GIF',
  'image/svg+xml': 'SVG',
  'video/mp4': 'MP4',
};

/**
 * Short format label for checklist attachment rows (non-image), from MIME or file name.
 */
export function checklistAttachmentFormatLabel(
  mimeType: string | null | undefined,
  fileName: string | null | undefined,
): string {
  const m = mimeType?.toLowerCase().trim();
  if (m && MIME_TO_SHORT_LABEL[m]) {
    return MIME_TO_SHORT_LABEL[m];
  }
  if (m?.startsWith('image/')) {
    return m.slice('image/'.length).toUpperCase().slice(0, 8);
  }
  const name = fileName?.trim() || '';
  const dot = name.lastIndexOf('.');
  if (dot >= 0 && dot < name.length - 1) {
    const ext = name.slice(dot + 1).toUpperCase();
    if (/^[A-Z0-9]{1,8}$/.test(ext)) {
      return ext;
    }
  }
  return 'FILE';
}

export function isImageMime(mimeType: string | null | undefined): boolean {
  return (mimeType ?? '').toLowerCase().startsWith('image/');
}
