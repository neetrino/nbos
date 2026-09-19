import type { BonusTypeEnum } from '@nbos/database';
import type { DeliveryCompensationRoleKey } from '@nbos/shared';

const ROLE_BONUS_TYPE: Record<DeliveryCompensationRoleKey, BonusTypeEnum> = {
  BACKEND: 'DELIVERY',
  FRONTEND: 'DELIVERY',
  QA: 'DELIVERY',
  TECHNICAL_SPECIALIST: 'DELIVERY',
  PM: 'PM',
  DESIGNER: 'DESIGN',
};

export function mapDeliveryBonusType(roleKey: DeliveryCompensationRoleKey): BonusTypeEnum {
  return ROLE_BONUS_TYPE[roleKey];
}
