/** UTF-8 byte length of a string. Do not use JS `string.length` for size budgets. */
export function utf8ByteLength(text: string): number {
  return new TextEncoder().encode(text).byteLength;
}

/** UTF-8 byte length of a JSON-serialized value. */
export function utf8JsonByteLength(value: unknown): number {
  return utf8ByteLength(JSON.stringify(value));
}
