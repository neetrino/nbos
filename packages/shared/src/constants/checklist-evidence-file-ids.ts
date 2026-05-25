/** Max Drive file assets referenced on one FILE_LINK / IMAGE_LINK / DOCUMENT_LINK step. */
export const CHECKLIST_TEMPLATE_EVIDENCE_MAX_FILES = 10;

const FILE_ASSET_UUID_LIKE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isChecklistFileAssetId(value: string): boolean {
  return FILE_ASSET_UUID_LIKE.test(value.trim());
}

function isHttpUrlEvidence(value: string): boolean {
  try {
    const u = new URL(value.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Parses stored `evidenceValue`: single UUID, JSON array of UUID strings, or empty.
 * Does not return URL strings (legacy single-URL values are handled separately).
 */
export function parseChecklistEvidenceFileAssetIds(
  evidenceValue: string | null | undefined,
): string[] {
  if (evidenceValue == null) {
    return [];
  }
  const t = evidenceValue.trim();
  if (!t) {
    return [];
  }
  if (t.startsWith('[')) {
    try {
      const parsed = JSON.parse(t) as unknown;
      if (!Array.isArray(parsed)) {
        return [];
      }
      const out: string[] = [];
      for (const el of parsed) {
        if (typeof el !== 'string') {
          continue;
        }
        const s = el.trim();
        if (isChecklistFileAssetId(s)) {
          out.push(s);
        }
      }
      return out;
    } catch {
      return [];
    }
  }
  if (isChecklistFileAssetId(t)) {
    return [t];
  }
  return [];
}

export function serializeChecklistEvidenceFileAssetIds(ids: string[]): string | null {
  const clean = ids.map((x) => x.trim()).filter((x) => isChecklistFileAssetId(x));
  if (clean.length === 0) {
    return null;
  }
  if (clean.length === 1) {
    return clean[0]!;
  }
  return JSON.stringify(clean);
}

export function appendChecklistEvidenceFileId(
  current: string | null | undefined,
  newId: string,
): string {
  const id = newId.trim();
  if (!isChecklistFileAssetId(id)) {
    throw new Error('Invalid file id.');
  }
  const cur = current?.trim() ?? '';
  if (cur && isHttpUrlEvidence(cur)) {
    return id;
  }
  const ids = parseChecklistEvidenceFileAssetIds(current);
  if (ids.length >= CHECKLIST_TEMPLATE_EVIDENCE_MAX_FILES) {
    throw new Error(
      `At most ${String(CHECKLIST_TEMPLATE_EVIDENCE_MAX_FILES)} files can be attached.`,
    );
  }
  return serializeChecklistEvidenceFileAssetIds([...ids, id])!;
}

export function removeChecklistEvidenceFileId(
  current: string | null | undefined,
  removeId: string,
): string | null {
  const id = removeId.trim();
  const ids = parseChecklistEvidenceFileAssetIds(current).filter((x) => x !== id);
  return serializeChecklistEvidenceFileAssetIds(ids);
}

/** Validation for FILE_LINK / IMAGE_LINK / DOCUMENT_LINK `evidenceValue`. */
export function isChecklistTemplateFileImageDocumentEvidenceValueOk(value: string): boolean {
  const t = value.trim();
  if (t.startsWith('[')) {
    try {
      const parsed = JSON.parse(t) as unknown;
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return false;
      }
      if (parsed.length > CHECKLIST_TEMPLATE_EVIDENCE_MAX_FILES) {
        return false;
      }
      for (const el of parsed) {
        if (typeof el !== 'string' || !isChecklistFileAssetId(el)) {
          return false;
        }
      }
      return true;
    } catch {
      return false;
    }
  }
  if (isChecklistFileAssetId(t)) {
    return true;
  }
  return isHttpUrlEvidence(t);
}
