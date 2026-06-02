/** ChecklistInstance.ownerEntityType for employee onboarding / rehire runs. */
export const EMPLOYEE_ONBOARDING_OWNER_TYPE = 'EMPLOYEE_ONBOARDING';

/** System checklist template name (created on first onboarding run if missing). */
export const EMPLOYEE_ONBOARDING_TEMPLATE_NAME = 'Employee Onboarding';

export interface EmployeeOnboardingChecklistItemSeed {
  id: string;
  title: string;
  instruction: string;
  decisionRequired: boolean;
  sortOrder: number;
  autoCompleteKey?: 'profile_active' | 'platform_access';
}

export const EMPLOYEE_ONBOARDING_CHECKLIST_ITEMS: readonly EmployeeOnboardingChecklistItemSeed[] = [
  {
    id: 'onboard-01',
    title: 'Employee profile active in NBOS',
    instruction: 'Profile restored after rehire; HR confirms core fields.',
    decisionRequired: true,
    sortOrder: 1,
    autoCompleteKey: 'profile_active',
  },
  {
    id: 'onboard-02',
    title: 'Assign primary seat and department',
    instruction: 'HR and department head confirm seat assignment.',
    decisionRequired: true,
    sortOrder: 2,
  },
  {
    id: 'onboard-03',
    title: 'Set up work email',
    instruction: 'Operations creates or restores mailbox access.',
    decisionRequired: true,
    sortOrder: 3,
  },
  {
    id: 'onboard-04',
    title: 'Telegram account ready',
    instruction: 'Employee confirms Telegram handle on profile.',
    decisionRequired: false,
    sortOrder: 4,
  },
  {
    id: 'onboard-05',
    title: 'Add to work Telegram chats',
    instruction: 'Department head adds employee to internal chats.',
    decisionRequired: true,
    sortOrder: 5,
  },
  {
    id: 'onboard-06',
    title: 'Grant NBOS Platform access',
    instruction: 'Login restored; Operations confirms module permissions per role.',
    decisionRequired: true,
    sortOrder: 6,
    autoCompleteKey: 'platform_access',
  },
  {
    id: 'onboard-07',
    title: 'Grant tooling access (Git, Figma, IDE)',
    instruction: 'Operations provisions external tooling accounts.',
    decisionRequired: true,
    sortOrder: 7,
  },
  {
    id: 'onboard-08',
    title: 'SOP orientation',
    instruction: 'Head of department walks through key SOP documents.',
    decisionRequired: true,
    sortOrder: 8,
  },
  {
    id: 'onboard-09',
    title: 'Assign mentor (Junior / Middle)',
    instruction: 'Head of department assigns mentor when applicable.',
    decisionRequired: false,
    sortOrder: 9,
  },
  {
    id: 'onboard-10',
    title: 'Team introduction',
    instruction: 'HR schedules intro with the team.',
    decisionRequired: true,
    sortOrder: 10,
  },
  {
    id: 'onboard-11',
    title: 'Assign first project',
    instruction: 'PM and department head assign initial delivery work.',
    decisionRequired: true,
    sortOrder: 11,
  },
  {
    id: 'onboard-12',
    title: 'Work schedule captured',
    instruction: 'Employee confirms schedule in profile or HR records.',
    decisionRequired: false,
    sortOrder: 12,
  },
  {
    id: 'onboard-13',
    title: 'Platform and process training',
    instruction: 'Mentor or HR completes intro training.',
    decisionRequired: true,
    sortOrder: 13,
  },
  {
    id: 'onboard-14',
    title: 'First 1-on-1 with manager',
    instruction: 'Department head holds first check-in.',
    decisionRequired: true,
    sortOrder: 14,
  },
  {
    id: 'onboard-15',
    title: 'First-week review',
    instruction: 'HR and department head review first week outcomes.',
    decisionRequired: true,
    sortOrder: 15,
  },
] as const;

export function buildEmployeeOnboardingSnapshotItems(options: {
  autoCompletedKeys: ReadonlySet<string>;
}): Array<Record<string, unknown>> {
  return EMPLOYEE_ONBOARDING_CHECKLIST_ITEMS.map((item) => {
    const autoDone =
      item.autoCompleteKey != null && options.autoCompletedKeys.has(item.autoCompleteKey);
    return {
      id: item.id,
      title: item.title,
      instruction: item.instruction,
      decisionRequired: item.decisionRequired,
      sortOrder: item.sortOrder,
      evidenceType: 'TEXT_ONLY',
      ...(autoDone ? { mark: 'DONE' as const } : {}),
    };
  });
}
