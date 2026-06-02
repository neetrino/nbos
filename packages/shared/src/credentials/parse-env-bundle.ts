export interface EnvBundleEntry {
  key: string;
  value: string;
}

export interface ParsedEnvBundle {
  entries: EnvBundleEntry[];
  warnings: string[];
  /** Normalized KEY=value lines for storage. */
  serialized: string;
}

const ENV_LINE_PATTERN = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/;

function stripMatchingQuotes(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length >= 2) {
    const q = trimmed[0];
    if ((q === '"' || q === "'") && trimmed.endsWith(q)) {
      return trimmed.slice(1, -1);
    }
  }
  return trimmed;
}

function parseEnvLine(line: string): EnvBundleEntry | null {
  const match = ENV_LINE_PATTERN.exec(line);
  if (!match) return null;
  return { key: match[1], value: stripMatchingQuotes(match[2]) };
}

/** Parses pasted `.env` text into key/value entries with preview warnings. */
export function parseEnvBundleText(text: string): ParsedEnvBundle {
  const warnings: string[] = [];
  const entries: EnvBundleEntry[] = [];
  const seen = new Set<string>();

  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    const parsed = parseEnvLine(raw);
    if (!parsed) {
      warnings.push(`Line ${i + 1}: skipped (not KEY=value)`);
      continue;
    }
    if (seen.has(parsed.key)) {
      warnings.push(`Duplicate key "${parsed.key}" — last value wins`);
      const idx = entries.findIndex((e) => e.key === parsed.key);
      if (idx >= 0) entries[idx] = parsed;
    } else {
      seen.add(parsed.key);
      entries.push(parsed);
    }
  }

  return {
    entries,
    warnings,
    serialized: serializeEnvBundle(entries),
  };
}

/** Serializes entries as standard `.env` lines. */
export function serializeEnvBundle(entries: EnvBundleEntry[]): string {
  return entries.map((e) => `${e.key}=${e.value}`).join('\n');
}
