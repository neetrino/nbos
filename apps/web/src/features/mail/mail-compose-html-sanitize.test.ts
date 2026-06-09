/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, beforeAll } from 'vitest';
import { JSDOM } from 'jsdom';
import {
  extractPlainTextFromHtml,
  htmlToPlainTextFallback,
  composeEditorHtmlToValue,
} from './mail-compose-html-sanitize';

beforeAll(() => {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  global.DOMParser = dom.window.DOMParser;
});

describe('extractPlainTextFromHtml', () => {
  it('extracts plain text without regex tag stripping', () => {
    expect(extractPlainTextFromHtml('<p>Hello <strong>world</strong></p>')).toBe('Hello world');
  });

  it('normalizes nbsp entities', () => {
    expect(extractPlainTextFromHtml('<p>Hello&nbsp;there</p>')).toBe('Hello there');
  });
});

describe('htmlToPlainTextFallback', () => {
  it('delegates to parser-based extraction', () => {
    expect(htmlToPlainTextFallback('<p>Hello <strong>world</strong></p>')).toBe('Hello world');
  });
});

describe('composeEditorHtmlToValue empty detection', () => {
  it('returns null for empty editor paragraphs', () => {
    expect(composeEditorHtmlToValue('<p></p>')).toBeNull();
    expect(composeEditorHtmlToValue('<p><br></p>')).toBeNull();
  });

  it('returns sanitized html for non-empty content', () => {
    const value = composeEditorHtmlToValue('<p>Hello</p>');
    expect(value).toContain('Hello');
  });
});
