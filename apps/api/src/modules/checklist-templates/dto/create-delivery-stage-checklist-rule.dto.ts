import {
  DeliveryChecklistTargetEnum,
  DeliveryStageEnum,
  ExtensionSizeEnum,
  ProductCategoryEnum,
  ProductTypeEnum,
} from '@nbos/database';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class CreateDeliveryStageChecklistRuleDto {
  @IsEnum(DeliveryChecklistTargetEnum)
  target!: DeliveryChecklistTargetEnum;

  @IsEnum(DeliveryStageEnum)
  deliveryStage!: DeliveryStageEnum;

  @IsUUID()
  checklistTemplateId!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  priority?: number;

  @IsOptional()
  @IsEnum(ProductCategoryEnum)
  filterProductCategory?: ProductCategoryEnum;

  @IsOptional()
  @IsEnum(ProductTypeEnum)
  filterProductType?: ProductTypeEnum;

  @IsOptional()
  @IsEnum(ExtensionSizeEnum)
  filterExtensionSize?: ExtensionSizeEnum;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
