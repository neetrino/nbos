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

const ENV_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

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

function isValidEnvKey(key: string): boolean {
  return ENV_KEY_PATTERN.test(key);
}

function parseEnvLine(line: string): EnvBundleEntry | null {
  let rest = line.trim();
  if (!rest) return null;

  if (rest.startsWith('export ')) {
    rest = rest.slice('export '.length).trimStart();
  }

  const eqIndex = rest.indexOf('=');
  if (eqIndex <= 0) return null;

  const key = rest.slice(0, eqIndex).trim();
  const rawValue = rest.slice(eqIndex + 1);
  if (!isValidEnvKey(key)) return null;

  return { key, value: stripMatchingQuotes(rawValue) };
}

function splitEnvTextLines(text: string): string[] {
  const lines: string[] = [];
  let lineStart = 0;
  for (let i = 0; i <= text.length; i += 1) {
    if (i === text.length || text[i] === '\n') {
      let lineEnd = i;
      if (lineEnd > lineStart && text[lineEnd - 1] === '\r') {
        lineEnd -= 1;
      }
      lines.push(text.slice(lineStart, lineEnd));
      lineStart = i + 1;
    }
  }
  return lines;
}

/** Parses pasted `.env` text into key/value entries with preview warnings. */
export function parseEnvBundleText(text: string): ParsedEnvBundle {
  const warnings: string[] = [];
  const entries: EnvBundleEntry[] = [];
  const seen = new Set<string>();

  const lines = splitEnvTextLines(text);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line === undefined) continue;
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const parsed = parseEnvLine(trimmed);
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

/** Parses stored bundle text into entries (same format as paste). */
export function entriesFromEnvBundleSerialized(serialized: string): EnvBundleEntry[] {
  if (!serialized.trim()) return [];
  return parseEnvBundleText(serialized).entries;
}
