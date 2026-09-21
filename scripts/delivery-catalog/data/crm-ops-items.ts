import type { CatalogSeedItem } from './catalog-seed-types';

/**
 * CRM и внутренние процессы. Категория показывает направление, а не ограничение: задачи или
 * канбан из этого блока спокойно выбираются и для магазина, если клиенту нужен такой модуль.
 */
export const CRM_OPS_ITEMS: readonly CatalogSeedItem[] = [
  {
    code: 'CRM_CONTACTS_COMPANIES',
    category: 'crm_ops',
    iconKey: 'Contact',
    title: 'Contacts and companies',
    summary: 'Customer directory with interaction history.',
    scopeBoundaries:
      'Contact and company records, relationships, history, search and filters, and duplicate handling.',
    units: { BACKEND: 20, FRONTEND: 14, PM: 3, DESIGNER: 3, QA: 5 },
  },
  {
    code: 'CRM_PIPELINE',
    category: 'crm_ops',
    iconKey: 'KanbanSquare',
    title: 'Deal pipeline',
    summary: 'Deals organized by stage with movement and amounts.',
    scopeBoundaries:
      'Pipeline stages, deal movement, required stage fields, loss reasons, amount, and forecast.',
    units: { BACKEND: 26, FRONTEND: 20, PM: 4, DESIGNER: 5, QA: 7 },
  },
  {
    code: 'CRM_LEAD_CAPTURE',
    category: 'crm_ops',
    iconKey: 'UserPlus',
    title: 'CRM lead capture',
    summary: 'Website and channel requests flow into the system.',
    scopeBoundaries:
      'Lead sources, owner assignment, deduplication, notification, and source attribution.',
    units: { BACKEND: 16, FRONTEND: 8, PM: 3, QA: 4 },
  },
  {
    code: 'CRM_TASKS',
    category: 'crm_ops',
    iconKey: 'ListChecks',
    title: 'Tasks and reminders',
    summary: 'Tasks with an assignee, deadline, and status.',
    scopeBoundaries:
      'Creation and assignment, deadlines and reminders, statuses, customer or deal linkage, and personal task list.',
    units: { BACKEND: 18, FRONTEND: 14, PM: 3, DESIGNER: 3, QA: 5 },
  },
  {
    code: 'CRM_TASK_BOARD',
    category: 'crm_ops',
    iconKey: 'KanbanSquare',
    title: 'Task Kanban board',
    summary: 'A column-based board with drag and drop.',
    scopeBoundaries:
      'Columns and ordering, drag and drop, filters and participants, and column limits. Gantt charts are excluded.',
    units: { BACKEND: 14, FRONTEND: 20, PM: 3, DESIGNER: 4, QA: 5 },
  },
  {
    code: 'CRM_WORKFLOW_AUTOMATION',
    category: 'crm_ops',
    iconKey: 'GitBranch',
    title: 'Workflow automation',
    summary: 'Rules that run an action when an event occurs.',
    scopeBoundaries:
      'Agreed triggers and actions, conditions, execution log, and loop prevention. The visual builder is a separate card.',
    units: { BACKEND: 30, FRONTEND: 12, PM: 4, QA: 8 },
  },
  {
    code: 'CRM_WORKFLOW_BUILDER',
    category: 'crm_ops',
    iconKey: 'GitBranch',
    title: 'Visual workflow builder',
    summary: 'Drag-and-drop workflow assembly on a diagram.',
    scopeBoundaries:
      'Block diagram, connections and conditions, pre-publication validation, workflow versions, and run history.',
    units: { BACKEND: 34, FRONTEND: 34, PM: 5, DESIGNER: 6, QA: 10 },
  },
  {
    code: 'CRM_CALL_LOG',
    category: 'crm_ops',
    iconKey: 'Phone',
    title: 'Customer interaction log',
    summary: 'Customer interaction history across all channels.',
    scopeBoundaries:
      'Unified channel history, customer and deal linkage, interaction outcome, search, and filters.',
    units: { BACKEND: 16, FRONTEND: 10, PM: 2, QA: 4 },
  },
  {
    code: 'CRM_QUOTES',
    category: 'crm_ops',
    iconKey: 'FileText',
    title: 'Sales proposals',
    summary: 'Creation and delivery of proposals to customers.',
    scopeBoundaries:
      'Proposal contents, amount calculation, printable form and delivery, versions and statuses, and customer acceptance.',
    units: { BACKEND: 20, FRONTEND: 12, PM: 3, DESIGNER: 4, QA: 5 },
  },
  {
    code: 'CRM_CONTRACTS',
    category: 'crm_ops',
    iconKey: 'FileText',
    title: 'Contracts and signing',
    summary: 'Contracts with statuses and files.',
    scopeBoundaries:
      'Templates and numbering, approval statuses, files and versions, and deadlines. Electronic signatures are a separate card.',
    units: { BACKEND: 20, FRONTEND: 10, PM: 3, QA: 5 },
  },
  {
    code: 'CRM_ESIGNATURE',
    category: 'crm_ops',
    iconKey: 'Fingerprint',
    title: 'Document electronic signatures',
    summary: 'Document signing through a provider.',
    scopeBoundaries:
      'One signature provider, signature requests, statuses, signed-file storage, and audit log.',
    units: { BACKEND: 20, FRONTEND: 8, PM: 3, QA: 5, TECHNICAL_SPECIALIST: 3 },
  },
  {
    code: 'CRM_SUPPORT_TICKETS',
    category: 'crm_ops',
    iconKey: 'LifeBuoy',
    title: 'Support tickets',
    summary: 'Customer requests with a queue and deadlines.',
    scopeBoundaries:
      'Creation from a channel or portal, queue and assignment, statuses and response deadlines, and conversation history.',
    units: { BACKEND: 24, FRONTEND: 16, PM: 4, DESIGNER: 4, QA: 6 },
  },
] as const;
