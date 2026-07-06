import type { EmployeeRef } from '@/lib/api/projects';
import { employeeInitials } from '@/features/hr/utils/employee-display';
import type { DeliveryBoardItem } from './project-delivery-board-model';

export type DeliveryCardTeamAvatarTone = 'amber' | 'blue' | 'cyan';

export type DeliveryCardTeamMember = {
  id: string;
  initials: string;
  fullName: string;
  roleLabel: string;
  tone: DeliveryCardTeamAvatarTone;
};

const AVATAR_TONE_CLASS: Record<DeliveryCardTeamAvatarTone, string> = {
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  blue: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
  cyan: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300',
};

export function deliveryCardTeamAvatarClassName(tone: DeliveryCardTeamAvatarTone): string {
  return `ring-card relative flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ring-2 ${AVATAR_TONE_CLASS[tone]}`;
}

function pushTeamMember(
  members: DeliveryCardTeamMember[],
  seenIds: Set<string>,
  person: EmployeeRef | null | undefined,
  roleLabel: string,
  tone: DeliveryCardTeamAvatarTone,
): void {
  if (!person?.id || seenIds.has(person.id)) return;
  seenIds.add(person.id);
  members.push({
    id: person.id,
    initials: employeeInitials(person),
    fullName: `${person.firstName} ${person.lastName}`.trim(),
    roleLabel,
    tone,
  });
}

/** Board card avatars: Developer, PM, Technical specialist only. */
export function getDeliveryBoardItemTeamMembers(item: DeliveryBoardItem): DeliveryCardTeamMember[] {
  const members: DeliveryCardTeamMember[] = [];
  const seenIds = new Set<string>();

  if (item.kind === 'PRODUCT') {
    const product = item.product;
    pushTeamMember(members, seenIds, product.developer, 'Developer', 'blue');
    pushTeamMember(members, seenIds, product.pm, 'PM', 'amber');
    pushTeamMember(members, seenIds, product.technicalSpecialist, 'Technical specialist', 'cyan');
    return members;
  }

  pushTeamMember(members, seenIds, item.extension.assignee, 'Developer', 'blue');
  return members;
}
