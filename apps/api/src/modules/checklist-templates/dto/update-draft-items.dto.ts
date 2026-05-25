import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CHECKLIST_TEMPLATE_ITEM_EVIDENCE_TYPES } from '@nbos/shared';
import { CHECKLIST_TEMPLATE_MAX_ITEMS } from '../checklist-template-items';

const evidenceTypeValues = [...CHECKLIST_TEMPLATE_ITEM_EVIDENCE_TYPES];

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

  @IsOptional()
  @IsIn(evidenceTypeValues)
  evidenceType?: (typeof CHECKLIST_TEMPLATE_ITEM_EVIDENCE_TYPES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  evidenceValue?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  evidenceLabel?: string | null;
}

export class UpdateDraftItemsDto {
  @IsArray()
  @ArrayMaxSize(CHECKLIST_TEMPLATE_MAX_ITEMS)
  @ValidateNested({ each: true })
  @Type(() => ChecklistTemplateItemBodyDto)
  items!: ChecklistTemplateItemBodyDto[];
}
