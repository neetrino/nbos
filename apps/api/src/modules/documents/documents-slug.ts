const SLUG_MAX = 80;
/** Caps work per slugify call to bound CPU (avoids ReDoS on pathological input). */
const SLUG_INPUT_MAX_SCALARS = 512;

function* unicodeScalars(s: string): Generator<string> {
  for (let i = 0; i < s.length; ) {
    const cp = s.codePointAt(i)!;
    i += cp > 0xffff ? 2 : 1;
    yield String.fromCodePoint(cp);
  }
}

/**
 * True when `scalar` is a single Unicode letter or number (one scalar value).
 * Uses short patterns on a bounded-length string, not unbounded `+` on user text.
 */
function isLetterOrNumber(scalar: string): boolean {
  return /\p{L}/u.test(scalar) || /\p{N}/u.test(scalar);
}

/**
 * URL-safe slug from a human title (ASCII fallback for empty result).
 * Implemented without polynomial-time regex on the full title (CodeQL / ReDoS).
 */
export function slugifyTitle(title: string): string {
  const lowered = title.trim().toLowerCase();
  let bounded = '';
  let n = 0;
  for (const sc of unicodeScalars(lowered)) {
    if (n >= SLUG_INPUT_MAX_SCALARS) break;
    bounded += sc;
    n += 1;
  }

  const parts: string[] = [];
  let lastWasHyphen = true;
  for (const sc of unicodeScalars(bounded)) {
    if (isLetterOrNumber(sc)) {
      parts.push(sc);
      lastWasHyphen = false;
    } else if (!lastWasHyphen) {
      parts.push('-');
      lastWasHyphen = true;
    }
  }

  let base = parts.join('');
  while (base.endsWith('-')) {
    base = base.slice(0, -1);
  }
  base = base.slice(0, SLUG_MAX);
  return base.length > 0 ? base : 'document';
}
