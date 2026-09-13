export type EmployeeSheetTabValue =
  | 'general'
  | 'departments'
  | 'security'
  | 'offboarding'
  | 'onboarding';

export function buildEmployeeSheetTabValues(input: {
  selfProfile: boolean;
  status: string;
  hasOnboardingChecklist: boolean;
}): EmployeeSheetTabValue[] {
  const tabs: EmployeeSheetTabValue[] = ['general', 'departments'];
  if (input.selfProfile) {
    tabs.push('security');
  }
  if (input.status === 'TERMINATED') {
    tabs.push('offboarding');
  } else if (input.hasOnboardingChecklist) {
    tabs.push('onboarding');
  }
  return tabs;
}
