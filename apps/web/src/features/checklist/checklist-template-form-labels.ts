import type {
  ChecklistOwnerModule,
  ChecklistTemplateCategory,
} from '@/lib/api/checklist-templates';

export const CHECKLIST_TEMPLATE_CATEGORY_LABELS: Record<ChecklistTemplateCategory, string> = {
  DELIVERY: 'Delivery',
  MAINTENANCE: 'Maintenance',
  QA: 'QA',
  TECHNICAL: 'Technical',
  SOP: 'Standard operating procedure',
  OTHER: 'Other',
};

export const CHECKLIST_OWNER_MODULE_LABELS: Record<ChecklistOwnerModule, string> = {
  MY_COMPANY: 'My company',
  PROJECTS: 'Projects',
  TASKS: 'Tasks',
  TECHNICAL: 'Technical',
};
