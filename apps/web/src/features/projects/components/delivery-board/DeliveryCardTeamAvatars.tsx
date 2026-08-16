'use client';

import { EmployeePersonAvatar } from '@/components/shared/EmployeePersonAvatar';
import {
  deliveryCardTeamAvatarClassName,
  getDeliveryBoardItemTeamMembers,
} from './delivery-board-card-team';
import type { DeliveryBoardItem } from './project-delivery-board-model';

export function DeliveryCardTeamAvatars({ item }: { item: DeliveryBoardItem }) {
  const members = getDeliveryBoardItemTeamMembers(item);
  if (members.length === 0) return null;

  return (
    <div className="mt-2.5 flex items-center justify-start gap-2">
      <div className="flex shrink-0 -space-x-1.5">
        {members.map((member) => (
          <span key={member.id} title={`${member.roleLabel}: ${member.fullName}`}>
            <EmployeePersonAvatar
              label={member.fullName}
              imageUrl={member.imageUrl}
              className={deliveryCardTeamAvatarClassName(member.tone)}
            />
          </span>
        ))}
      </div>
    </div>
  );
}
