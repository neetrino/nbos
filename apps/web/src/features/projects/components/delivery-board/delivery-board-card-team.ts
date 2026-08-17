import type { EmployeeRef } from '@/lib/api/projects';
import { employeeFullName } from '@/features/hr/utils/employee-display';
import type { DeliveryBoardItem } from './project-delivery-board-model';

export type DeliveryCardTeamAvatarTone = 'amber' | 'blue' | 'cyan';

export type DeliveryCardTeamMember = {
  id: string;
  fullName: string;
  roleLabel: string;
  tone: DeliveryCardTeamAvatarTone;
  imageUrl?: string;
};

const AVATAR_TONE_CLASS: Record<DeliveryCardTeamAvatarTone, string> = {
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  blue: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
  cyan: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300',
};

export function deliveryCardTeamAvatarClassName(tone: DeliveryCardTeamAvatarTone): string {
  return `relative flex h-8 w-8 items-center justify-center rounded-full border border-border/40 text-[10px] font-bold ${AVATAR_TONE_CLASS[tone]}`;
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
  const imageUrl = person.avatar?.trim() || undefined;
  members.push({
    id: person.id,
    fullName: employeeFullName(person),
    roleLabel,
    tone,
    imageUrl,
  });
}

/** Board card avatars: Backend, Frontend, PM, Technical specialist. */
export function getDeliveryBoardItemTeamMembers(item: DeliveryBoardItem): DeliveryCardTeamMember[] {
  const members: DeliveryCardTeamMember[] = [];
  const seenIds = new Set<string>();

  if (item.kind === 'PRODUCT') {
    const product = item.product;
    pushTeamMember(members, seenIds, product.developer, 'Developer Backend', 'blue');
    pushTeamMember(members, seenIds, product.frontendDeveloper, 'Developer Frontend', 'blue');
    pushTeamMember(members, seenIds, product.pm, 'PM', 'amber');
    pushTeamMember(members, seenIds, product.technicalSpecialist, 'Technical specialist', 'cyan');
    return members;
  }

  pushTeamMember(members, seenIds, item.extension.assignee, 'Developer', 'blue');
  return members;
}
