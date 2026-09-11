import type { DetailSheetTabItem } from '@/components/shared';

export function buildEmployeeSheetTabs(input: {
  selfProfile: boolean;
  status: string;
  hasOnboardingChecklist: boolean;
}): DetailSheetTabItem[] {
  const tabs: DetailSheetTabItem[] = [
    { value: 'general', label: 'General' },
    { value: 'departments', label: 'Departments' },
  ];
  if (input.selfProfile) {
    tabs.push({ value: 'security', label: 'Security' });
  }
  if (input.status === 'TERMINATED') {
    tabs.push({ value: 'offboarding', label: 'Offboarding' });
  } else if (input.hasOnboardingChecklist) {
    tabs.push({ value: 'onboarding', label: 'Onboarding' });
  }
  return tabs;
}
