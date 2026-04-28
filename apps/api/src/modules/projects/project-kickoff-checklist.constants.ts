export interface ProjectKickoffChecklistDefinition {
  key: string;
  title: string;
  isRequired: boolean;
  sortOrder: number;
}

export const MAX_KICKOFF_CHECKLIST_NOTE_LENGTH = 1000;

export const PROJECT_KICKOFF_CHECKLIST_ITEMS: ProjectKickoffChecklistDefinition[] = [
  { key: 'scope_confirmed', title: 'Scope confirmed', isRequired: true, sortOrder: 10 },
  { key: 'milestones_aligned', title: 'Milestones aligned', isRequired: true, sortOrder: 20 },
  { key: 'deliverables_recorded', title: 'Deliverables recorded', isRequired: true, sortOrder: 30 },
  {
    key: 'payment_plan_understood',
    title: 'Payment plan understood',
    isRequired: true,
    sortOrder: 40,
  },
  { key: 'deadline_set', title: 'Deadline set', isRequired: true, sortOrder: 50 },
  {
    key: 'team_budget_understood',
    title: 'Team budget understood',
    isRequired: true,
    sortOrder: 60,
  },
  {
    key: 'client_contacts_collected',
    title: 'Client contacts collected',
    isRequired: true,
    sortOrder: 70,
  },
  {
    key: 'communication_channel_ready',
    title: 'Communication channel ready',
    isRequired: true,
    sortOrder: 80,
  },
  {
    key: 'client_introduced_to_pm',
    title: 'Client introduced to PM',
    isRequired: true,
    sortOrder: 90,
  },
  {
    key: 'project_type_confirmed',
    title: 'Project type confirmed',
    isRequired: true,
    sortOrder: 100,
  },
  { key: 'accesses_collected', title: 'Accesses collected', isRequired: true, sortOrder: 110 },
  {
    key: 'infrastructure_needs_defined',
    title: 'Infrastructure needs defined',
    isRequired: true,
    sortOrder: 120,
  },
  { key: 'risks_documented', title: 'Risks documented', isRequired: true, sortOrder: 130 },
  {
    key: 'special_terms_documented',
    title: 'Special terms documented',
    isRequired: true,
    sortOrder: 140,
  },
  {
    key: 'partner_terms_checked',
    title: 'Partner terms checked when applicable',
    isRequired: false,
    sortOrder: 150,
  },
];
