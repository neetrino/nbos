export interface EntitySheetStackInput {
  forceNestedBackdrop: boolean;
  stackAboveEntitySheet: boolean;
  /** Relation overlay opened while a nested item sheet (invoice, task, …) is already up. */
  stackAboveNestedItem: boolean;
}

export interface EntitySheetStackFlags {
  forceNestedBackdrop: boolean;
  stackAboveEntitySheet: boolean;
}

/**
 * Third-level relation sheets (company from a nested invoice) must use
 * `stackAboveEntitySheet` so overlay z-80 covers the nested item rail at 71.
 */
export function resolveEntitySheetStack(input: EntitySheetStackInput): EntitySheetStackFlags {
  const stackAboveEntitySheet = input.stackAboveEntitySheet || input.stackAboveNestedItem;
  return {
    forceNestedBackdrop: input.forceNestedBackdrop && !stackAboveEntitySheet,
    stackAboveEntitySheet,
  };
}

export function isNestedItemSheetActive(nested: boolean, openSheets: readonly boolean[]): boolean {
  return nested && openSheets.some(Boolean);
}
