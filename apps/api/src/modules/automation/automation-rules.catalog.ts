/**
 * Automation Rules (event-triggered) — v1 catalog in code per Tasks canon doc 03.
 * Distinct from Task Blueprints (`task-blueprints.constants.ts`).
 */
export type AutomationRuleCatalogEntry = {
  code: string;
  trigger: string;
  description: string;
  module: 'projects' | 'crm' | 'support' | 'tasks';
};

export const AUTOMATION_RULES_CATALOG: AutomationRuleCatalogEntry[] = [
  {
    code: 'product.launch_tasks',
    trigger: 'Product created / type known',
    description: 'Creates the standard delivery task pack for the product type (blueprint).',
    module: 'projects',
  },
  {
    code: 'deal.won_tasks',
    trigger: 'Deal marked won',
    description: 'Creates pre-sales / delivery starter tasks linked to the deal.',
    module: 'crm',
  },
  {
    code: 'extension.delivered_close_tickets',
    trigger: 'Extension marked Done',
    description: 'Closes linked support tickets after extension delivery.',
    module: 'support',
  },
  {
    code: 'task.review_requested',
    trigger: 'Task submitted for Review',
    description: 'In-app notification to reviewer or assignee.',
    module: 'tasks',
  },
];
