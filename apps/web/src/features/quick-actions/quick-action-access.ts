export function canUseQuickTaskSurface(
  isLoading: boolean,
  meLoadError: string | null,
  canViewTasks: boolean,
): boolean {
  if (isLoading || meLoadError) {
    return true;
  }
  return canViewTasks;
}
