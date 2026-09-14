/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest';
import { shouldReplaceComposeEditorContent } from './mail-compose-editor-sync';

describe('shouldReplaceComposeEditorContent', () => {
  it('does not replace when parent value is the last editor emit', () => {
    const stored = '<p>Hello</p><p><br></p><p>World</p>';
    expect(
      shouldReplaceComposeEditorContent({
        incomingValue: stored,
        lastEmittedValue: stored,
        currentEditorHtml: '<p>Hello</p><p></p><p>World</p>',
      }),
    ).toBe(false);
  });

  it('replaces when a different external document arrives', () => {
    expect(
      shouldReplaceComposeEditorContent({
        incomingValue: '<p>Reset draft</p>',
        lastEmittedValue: '<p>Previous</p>',
        currentEditorHtml: '<p>Previous</p>',
      }),
    ).toBe(true);
  });

  it('does not replace when mapped HTML already matches the editor', () => {
    expect(
      shouldReplaceComposeEditorContent({
        incomingValue: '<p>Hello</p>',
        lastEmittedValue: null,
        currentEditorHtml: '<p>Hello</p>',
      }),
    ).toBe(false);
  });
});
