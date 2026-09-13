/**
 * Overlay click / Escape closes the checklist layer first.
 * Dunked task chrome stays inert under the scrim until the layer hides.
 */
export function consumeQuickCreateChecklistDismiss(checklistOpen: boolean): boolean {
  return checklistOpen;
}
