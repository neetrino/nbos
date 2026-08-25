/** fetch decompresses gzip/br; that length no longer matches the decoded body. Identity encoding is safe to keep. */
export function shouldStripDecodedContentLength(contentEncoding: string | null): boolean {
  const encoding = contentEncoding?.trim().toLowerCase();
  return Boolean(encoding && encoding !== 'identity');
}
