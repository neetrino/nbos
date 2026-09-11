import { describe, expect, it } from 'vitest';
import { utf8ByteLength, utf8JsonByteLength } from './messenger-utf8-bytes';

describe('utf8ByteLength', () => {
  it('counts UTF-8 bytes, not JavaScript string length', () => {
    expect('й'.length).toBe(1);
    expect(utf8ByteLength('й')).toBe(2);
    expect(utf8ByteLength('☃')).toBe(3);
    expect(utf8ByteLength('hello')).toBe(5);
  });

  it('measures JSON payloads in UTF-8 bytes', () => {
    expect(utf8JsonByteLength({ preview: 'й' })).toBeGreaterThan(
      JSON.stringify({ preview: 'й' }).length,
    );
    expect(utf8JsonByteLength({ preview: 'hello' })).toBe(
      JSON.stringify({ preview: 'hello' }).length,
    );
  });
});
