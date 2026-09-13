const ICU_ARG_FIRST = /[A-Za-z]/;
const ICU_ARG_REST = /[A-Za-z0-9]/;

/**
 * Returns top-level ICU argument names in a message string.
 * Nested `{...}` bodies (plural/select text) are skipped so translated
 * inner copy is not treated as an interpolation name.
 */
export function extractIcuArgNames(value: string): string[] {
  const names = new Set<string>();
  let index = 0;
  while (index < value.length) {
    if (value[index] !== '{') {
      index += 1;
      continue;
    }
    const nameStart = index + 1;
    if (nameStart < value.length && ICU_ARG_FIRST.test(value[nameStart] ?? '')) {
      let nameEnd = nameStart;
      while (nameEnd < value.length && ICU_ARG_REST.test(value[nameEnd] ?? '')) {
        nameEnd += 1;
      }
      names.add(value.slice(nameStart, nameEnd));
    }
    index = skipIcuGroup(value, index);
  }
  return [...names].sort();
}

function skipIcuGroup(value: string, openIndex: number): number {
  let depth = 1;
  let index = openIndex + 1;
  while (index < value.length && depth > 0) {
    const char = value[index];
    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
    }
    index += 1;
  }
  return index;
}
