import { describe, expect, it } from 'vitest';
import { normalizeEmailSubject, sanitizeEmailHtml } from './mail-html-sanitize';

function sanitized(html: string): string {
  const result = sanitizeEmailHtml(html);
  expect(result).not.toBeNull();
  return result as string;
}

describe('sanitizeEmailHtml', () => {
  it('removes script tags and keeps safe content', () => {
    const out = sanitized('<script>alert(1)</script><p>Hello</p>');
    expect(out).toContain('Hello');
    expect(out.toLowerCase()).not.toContain('<script');
    expect(out).not.toContain('alert(1)');
  });

  it('removes event handler attributes', () => {
    const out = sanitized('<img src=x onerror=alert(1)><p onclick="bad()">Hi</p>');
    expect(out.toLowerCase()).not.toContain('onerror');
    expect(out.toLowerCase()).not.toContain('onclick');
    expect(out).toContain('Hi');
  });

  it('blocks javascript: URLs in links', () => {
    const out = sanitized('<a href="javascript:alert(1)">Click</a>');
    expect(out.toLowerCase()).not.toContain('javascript:');
    expect(out).toContain('Click');
  });

  it('keeps safe https links', () => {
    const out = sanitized('<a href="https://example.com">Example</a>');
    expect(out).toContain('href="https://example.com"');
    expect(out).toContain('Example');
    expect(out).toContain('rel="noopener noreferrer"');
    expect(out).toContain('target="_blank"');
  });

  it('keeps safe inline formatting styles', () => {
    const out = sanitized(
      '<p style="text-align:center"><span style="font-size:16px;color:#ff0000">Hello</span></p>',
    );
    expect(out).toContain('text-align:center');
    expect(out).toContain('font-size:16px');
    expect(out).toContain('color:#ff0000');
    expect(out).toContain('Hello');
  });

  it('keeps table structure and safe cell styles', () => {
    const out = sanitized(
      '<table><tbody><tr><td style="border:1px solid #ccc;padding:4px">A</td></tr></tbody></table>',
    );
    expect(out).toContain('<table');
    expect(out).toContain('<td');
    expect(out).toContain('border:1px solid #ccc');
    expect(out).toContain('padding:4px');
    expect(out).toContain('A');
  });

  it('returns null for empty input', () => {
    expect(sanitizeEmailHtml(null)).toBeNull();
    expect(sanitizeEmailHtml('')).toBeNull();
    expect(sanitizeEmailHtml('   ')).toBeNull();
  });

  it('handles malformed pre/code markup safely', () => {
    const out = sanitized('<pre class="bxhtmled-code"><br></pre>');
    expect(out.toLowerCase()).not.toContain('<script');
    expect(out).toContain('bxhtmled-code');
  });

  it('strips dangerous style tag content', () => {
    const out = sanitized('<style>body{background:url(javascript:alert(1))}</style><p>Safe</p>');
    expect(out.toLowerCase()).not.toContain('<style');
    expect(out).toContain('Safe');
  });

  it('blocks unsafe css url() in inline styles', () => {
    const out = sanitized('<p style="background-image:url(javascript:alert(1))">Text</p>');
    expect(out.toLowerCase()).not.toContain('url(');
    expect(out).toContain('Text');
  });
});

describe('normalizeEmailSubject', () => {
  it('strips single Re:/Fwd:/FW: prefixes', () => {
    expect(normalizeEmailSubject('Re: Test')).toBe('Test');
    expect(normalizeEmailSubject('Fwd: Test')).toBe('Test');
    expect(normalizeEmailSubject('FW: Test')).toBe('Test');
  });

  it('strips chained prefixes', () => {
    expect(normalizeEmailSubject('Re: Fwd: FW: Test')).toBe('Test');
  });

  it('handles spaces around prefix and colon', () => {
    expect(normalizeEmailSubject('   Re   :   Test')).toBe('Test');
  });

  it('does not strip malformed prefixes without colon', () => {
    expect(normalizeEmailSubject('Re Test')).toBe('Re Test');
  });

  it('returns quickly for huge whitespace-only prefix attempts', () => {
    const huge = `${' '.repeat(50_000)}Re: Final subject`;
    const started = performance.now();
    expect(normalizeEmailSubject(huge)).toBe('Final subject');
    expect(performance.now() - started).toBeLessThan(500);
  });
});
