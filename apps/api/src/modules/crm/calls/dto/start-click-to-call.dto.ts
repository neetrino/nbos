import { IsIn, IsUUID } from 'class-validator';

export const CLICK_TO_CALL_TARGET_TYPES = ['LEAD', 'CONTACT', 'DEAL'] as const;

export type ClickToCallTargetType = (typeof CLICK_TO_CALL_TARGET_TYPES)[number];

export class StartClickToCallDto {
  @IsIn(CLICK_TO_CALL_TARGET_TYPES)
  targetType!: ClickToCallTargetType;

  @IsUUID()
  targetId!: string;
}
