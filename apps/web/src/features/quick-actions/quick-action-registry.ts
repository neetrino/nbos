/** Metadata-only Quick Actions registry. Forms stay in their domain modules. */
import {
  QUICK_TASK_ACTION_ID,
  QUICK_TASK_DESTINATION,
  QUICK_TASK_MODULE,
  QUICK_TASK_ROUTE,
} from './quick-action-constants';

export interface QuickActionDefinition {
  id: string;
  route: string;
  module: typeof QUICK_TASK_MODULE;
  destination: string;
  messageKey: 'task';
}

export const QUICK_ACTIONS: readonly QuickActionDefinition[] = [
  {
    id: QUICK_TASK_ACTION_ID,
    route: QUICK_TASK_ROUTE,
    module: QUICK_TASK_MODULE,
    destination: QUICK_TASK_DESTINATION,
    messageKey: 'task',
  },
];

export function getQuickActionByRoute(pathname: string): QuickActionDefinition | undefined {
  return QUICK_ACTIONS.find((action) => action.route === pathname);
}
