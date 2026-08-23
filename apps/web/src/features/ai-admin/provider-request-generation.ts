export function startRequestGeneration(current: number): number {
  return current + 1;
}

export function isActiveRequestGeneration(started: number, current: number): boolean {
  return started === current;
}

export function canDismissProviderDialog(busy: boolean): boolean {
  return !busy;
}

export function shouldApplyProviderSaveSuccess(
  startedGeneration: number,
  currentGeneration: number,
): boolean {
  return isActiveRequestGeneration(startedGeneration, currentGeneration);
}
