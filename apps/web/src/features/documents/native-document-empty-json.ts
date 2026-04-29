/** Empty TipTap document JSON (native editor default). */
export function getEmptyNativeDocumentJson(): Record<string, unknown> {
  return {
    type: 'doc',
    content: [{ type: 'paragraph' }],
  };
}
