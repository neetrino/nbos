/**
 * Overlay click / Escape closes the active layer first.
 * Dunked task chrome stays inert under the scrim until the layer hides.
 */
export function consumeQuickCreateLayerDismiss(layerOpen: boolean): boolean {
  return layerOpen;
}
