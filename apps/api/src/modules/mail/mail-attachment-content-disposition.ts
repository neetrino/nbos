const ASCII_FALLBACK = 'attachment';

/** Content-Disposition for a browser download. Strips header-breaking characters. */
export function attachmentContentDisposition(fileName: string): string {
  const cleaned = fileName
    .replace(/[\r\n"]/g, '_')
    .trim()
    .slice(0, 180);
  const label = cleaned.length > 0 ? cleaned : ASCII_FALLBACK;
  const ascii = label.replace(/[^\x20-\x7E]/g, '_') || ASCII_FALLBACK;
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(label)}`;
}
