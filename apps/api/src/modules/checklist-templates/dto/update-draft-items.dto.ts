import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CHECKLIST_TEMPLATE_MAX_ITEMS } from '../checklist-template-items';

export class ChecklistTemplateItemBodyDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  id?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title!: string;

  @IsString()
  @MaxLength(20_000)
  instruction!: string;

  @IsBoolean()
  decisionRequired!: boolean;

  @IsInt()
  sortOrder!: number;
}

export class UpdateDraftItemsDto {
  @IsArray()
  @ArrayMaxSize(CHECKLIST_TEMPLATE_MAX_ITEMS)
  @ValidateNested({ each: true })
  @Type(() => ChecklistTemplateItemBodyDto)
  items!: ChecklistTemplateItemBodyDto[];
}
