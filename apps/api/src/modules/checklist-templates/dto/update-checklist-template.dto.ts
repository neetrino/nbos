import {
  ChecklistOwnerModuleEnum,
  ChecklistTemplateCategoryEnum,
  ChecklistTemplateStatusEnum,
} from '@nbos/database';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateChecklistTemplateDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @IsOptional()
  @IsEnum(ChecklistTemplateCategoryEnum)
  category?: ChecklistTemplateCategoryEnum;

  @IsOptional()
  @IsEnum(ChecklistOwnerModuleEnum)
  ownerModule?: ChecklistOwnerModuleEnum;

  @IsOptional()
  @IsEnum(ChecklistTemplateStatusEnum)
  status?: ChecklistTemplateStatusEnum;
}
