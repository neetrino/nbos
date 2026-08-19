import type { DetailSheetTabItem } from '@/components/shared';

interface BuildLeadDetailSheetTabsOptions {
  canCreateTask: boolean;
  onCreateTask: () => void;
}

/** Adds hover + on Lead Task tab when create is allowed. */
export function buildLeadDetailSheetTabs(
  baseTabs: readonly DetailSheetTabItem[],
  options: BuildLeadDetailSheetTabsOptions,
): DetailSheetTabItem[] {
  return baseTabs.map((tab) => {
    if (tab.value === 'task' && options.canCreateTask) {
      return {
        ...tab,
        quickCreate: {
          onCreate: options.onCreateTask,
          ariaLabel: 'Create task',
        },
      };
    }
    return tab;
  });
}
