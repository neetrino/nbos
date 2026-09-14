import { composeValueToEditorHtml } from './mail-compose-html-sanitize';

/**
 * Parent compose `value` must not be written back into TipTap when it is the
 * echo of the last editor emit. `setContent` on that echo resets the caret to
 * the document end, which makes mid-document editing unusable.
 */
export function shouldReplaceComposeEditorContent(params: {
  incomingValue: string | null | undefined;
  lastEmittedValue: string | null | undefined;
  currentEditorHtml: string;
}): boolean {
  if (params.incomingValue === params.lastEmittedValue) {
    return false;
  }
  return composeValueToEditorHtml(params.incomingValue) !== params.currentEditorHtml;
}
