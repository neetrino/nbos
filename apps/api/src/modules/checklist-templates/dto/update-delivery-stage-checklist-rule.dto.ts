import { DeliveryStageEnum } from '@nbos/database';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class UpdateDeliveryStageChecklistRuleDto {
  @IsOptional()
  @IsEnum(DeliveryStageEnum)
  deliveryStage?: DeliveryStageEnum;

  @IsOptional()
  @IsUUID()
  checklistTemplateId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  priority?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
