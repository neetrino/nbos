import { describe, expect, it } from 'vitest';
import {
  editorHtmlToNotesValue,
  isHtmlNotesValue,
  notesValueToEditorHtml,
} from './entity-notes-value';

describe('entity-notes-value', () => {
  it('detects html vs plain', () => {
    expect(isHtmlNotesValue('hello')).toBe(false);
    expect(isHtmlNotesValue('<p>hi</p>')).toBe(true);
  });

  it('wraps plain text in paragraphs', () => {
    expect(notesValueToEditorHtml('Line one\nLine two')).toContain('<p>Line one</p>');
    expect(notesValueToEditorHtml('Line one\nLine two')).toContain('<p>Line two</p>');
  });

  it('empty editor html becomes null', () => {
    expect(editorHtmlToNotesValue('<p></p>')).toBeNull();
    expect(editorHtmlToNotesValue('<p><br></p>')).toBeNull();
  });

  it('preserves bold markup', () => {
    const out = editorHtmlToNotesValue('<p><strong>Important</strong></p>');
    expect(out).toContain('strong');
  });
});
