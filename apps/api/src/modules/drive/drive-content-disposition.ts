import { BadRequestException } from '@nestjs/common';

const ASSET_VIEW_DISPOSITIONS = ['inline', 'attachment'] as const;

/** How the browser should treat a short-lived file URL. */
export type AssetViewDisposition = (typeof ASSET_VIEW_DISPOSITIONS)[number];

const FALLBACK_DOWNLOAD_NAME = 'download';
const FILENAME_MAX_LENGTH = 180;
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;
const QUOTE_OR_BACKSLASH = /["\\]/g;
const NON_ASCII = /[^\x20-\x7E]/g;
const RFC_5987_EXTRA = /['()*]/g;

/**
 * Accepts the preview-url `disposition` query. Empty means inline preview.
 */
export function parseAssetViewDisposition(raw?: string): AssetViewDisposition {
  const value = raw?.trim() ?? '';
  if (value === '' || value === 'inline') return 'inline';
  if (value === 'attachment') return 'attachment';
  throw new BadRequestException('disposition must be inline or attachment');
}

/**
 * Content-Disposition for a presigned download. ASCII `filename` is a fallback;
 * `filename*` keeps the original display name, including non-ASCII.
 */
export function attachmentContentDisposition(displayName: string): string {
  const cleaned = displayName.replace(CONTROL_CHARS, '').trim();
  const source = cleaned.length > 0 ? cleaned : FALLBACK_DOWNLOAD_NAME;
  const ascii = source
    .replace(QUOTE_OR_BACKSLASH, '_')
    .replace(NON_ASCII, '_')
    .slice(0, FILENAME_MAX_LENGTH)
    .trim();
  const token = ascii.length > 0 ? ascii : FALLBACK_DOWNLOAD_NAME;
  return `attachment; filename="${token}"; filename*=UTF-8''${encodeRfc5987(source)}`;
}

export function assetViewResponseHeaders(input: {
  mimeType: string | null;
  displayName: string;
  disposition: AssetViewDisposition;
}): { ResponseContentType?: string; ResponseContentDisposition?: string } {
  return {
    ResponseContentType: input.mimeType ?? undefined,
    ...(input.disposition === 'attachment'
      ? { ResponseContentDisposition: attachmentContentDisposition(input.displayName) }
      : {}),
  };
}

function encodeRfc5987(value: string): string {
  return encodeURIComponent(value).replace(
    RFC_5987_EXTRA,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}
