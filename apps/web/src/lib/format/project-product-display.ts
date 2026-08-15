const CODE_NAME_SEPARATORS = [' — ', ' · ', ' - '] as const;

type NamedEntity = {
  name?: string | null;
};

/**
 * UI label for a project or product link: name only (never internal code).
 * Also strips legacy `${code} — ${name}` / `${code} · ${name}` composites.
 */
export function entityDisplayName(entity: NamedEntity | null | undefined): string | null {
  if (!entity) return null;
  return stripEntityCodePrefix(entity.name);
}

/** Strip leading `CODE — ` / `CODE · ` from a composite label string. */
export function stripEntityCodePrefix(label: string | null | undefined): string | null {
  if (!label) return null;
  const trimmed = label.trim();
  if (!trimmed) return null;
  for (const separator of CODE_NAME_SEPARATORS) {
    const index = trimmed.indexOf(separator);
    if (index > 0) {
      const after = trimmed.slice(index + separator.length).trim();
      if (after) return after;
    }
  }
  return trimmed;
}

export function projectDisplayName(project: NamedEntity | null | undefined): string | null {
  return entityDisplayName(project);
}

export function productDisplayName(product: NamedEntity | null | undefined): string | null {
  return entityDisplayName(product);
}
