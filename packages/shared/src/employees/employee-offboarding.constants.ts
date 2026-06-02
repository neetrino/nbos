/** ChecklistInstance.ownerEntityType for employee offboarding runs. */
export const EMPLOYEE_OFFBOARDING_OWNER_TYPE = 'EMPLOYEE_OFFBOARDING';

/** System checklist template name (created on first offboard if missing). */
export const EMPLOYEE_OFFBOARDING_TEMPLATE_NAME = 'Employee Offboarding';

export interface EmployeeOffboardingChecklistItemSeed {
  id: string;
  title: string;
  instruction: string;
  decisionRequired: boolean;
  sortOrder: number;
  autoCompleteKey?: 'platform_access' | 'credentials_access' | 'profile_archived';
}

export const EMPLOYEE_OFFBOARDING_CHECKLIST_ITEMS: readonly EmployeeOffboardingChecklistItemSeed[] =
  [
    {
      id: 'offboard-01',
      title: 'Notify team and clients if needed',
      instruction: 'Head of department confirms stakeholders are informed.',
      decisionRequired: true,
      sortOrder: 1,
    },
    {
      id: 'offboard-02',
      title: 'Transfer active projects',
      instruction: 'Reassign project ownership and delivery roles before last day.',
      decisionRequired: true,
      sortOrder: 2,
    },
    {
      id: 'offboard-03',
      title: 'Transfer active tasks',
      instruction: 'PM reassigns open tasks listed in the offboarding inventory.',
      decisionRequired: true,
      sortOrder: 3,
    },
    {
      id: 'offboard-04',
      title: 'Transfer client contacts (Seller)',
      instruction: 'Sales leadership confirms CRM ownership handoff.',
      decisionRequired: false,
      sortOrder: 4,
    },
    {
      id: 'offboard-05',
      title: 'Revoke NBOS Platform access',
      instruction: 'System blocks login and platform permissions on offboard.',
      decisionRequired: true,
      sortOrder: 5,
      autoCompleteKey: 'platform_access',
    },
    {
      id: 'offboard-06',
      title: 'Revoke Git, Figma, IDE access',
      instruction: 'Operations revokes external tooling accounts.',
      decisionRequired: true,
      sortOrder: 6,
    },
    {
      id: 'offboard-07',
      title: 'Revoke work email access',
      instruction: 'Operations disables mailbox and aliases.',
      decisionRequired: true,
      sortOrder: 7,
    },
    {
      id: 'offboard-08',
      title: 'Remove from work Telegram chats',
      instruction: 'Department head removes the employee from internal chats.',
      decisionRequired: true,
      sortOrder: 8,
    },
    {
      id: 'offboard-09',
      title: 'Revoke Credentials vault access',
      instruction: 'Manual credential grants and team/project access are revoked automatically.',
      decisionRequired: true,
      sortOrder: 9,
      autoCompleteKey: 'credentials_access',
    },
    {
      id: 'offboard-10',
      title: 'Rotate critical shared passwords',
      instruction: 'Review credentials the employee could access and rotate critical secrets.',
      decisionRequired: true,
      sortOrder: 10,
    },
    {
      id: 'offboard-11',
      title: 'Final payroll and bonus calculation',
      instruction: 'Finance reviews compensation profile and active bonus releases.',
      decisionRequired: true,
      sortOrder: 11,
    },
    {
      id: 'offboard-12',
      title: 'Pay final settlement',
      instruction: 'Finance confirms payout per policy and law.',
      decisionRequired: true,
      sortOrder: 12,
    },
    {
      id: 'offboard-13',
      title: 'Archive employee profile',
      instruction: 'Profile status is set to Terminated with termination date.',
      decisionRequired: true,
      sortOrder: 13,
      autoCompleteKey: 'profile_archived',
    },
    {
      id: 'offboard-14',
      title: 'Exit interview (optional)',
      instruction: 'HR schedules optional exit interview.',
      decisionRequired: false,
      sortOrder: 14,
    },
  ] as const;

export function buildEmployeeOffboardingSnapshotItems(options: {
  autoCompletedKeys: ReadonlySet<string>;
}): Array<Record<string, unknown>> {
  return EMPLOYEE_OFFBOARDING_CHECKLIST_ITEMS.map((item) => {
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
