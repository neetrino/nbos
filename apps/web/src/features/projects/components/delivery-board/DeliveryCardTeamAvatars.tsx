import {
  deliveryCardTeamAvatarClassName,
  getDeliveryBoardItemTeamMembers,
} from './delivery-board-card-team';
import type { DeliveryBoardItem } from './project-delivery-board-model';

export function DeliveryCardTeamAvatars({ item }: { item: DeliveryBoardItem }) {
  const members = getDeliveryBoardItemTeamMembers(item);
  if (members.length === 0) return null;

  return (
    <div className="mt-3 flex items-center justify-between gap-2">
      <div className="flex shrink-0 -space-x-1.5">
        {members.map((member) => (
          <span
            key={member.id}
            className={deliveryCardTeamAvatarClassName(member.tone)}
            title={`${member.roleLabel}: ${member.fullName}`}
          >
            {member.initials}
          </span>
        ))}
      </div>
    </div>
  );
}
