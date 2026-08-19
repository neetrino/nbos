import { Type } from 'class-transformer';
import { IsIn, IsObject, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import {
  LEAD_MERGE_ALLOWED_STATUS_OVERRIDES,
  type LeadMergeFieldChoices,
  type LeadMergeFieldSide,
} from '@nbos/shared';

const SIDES: LeadMergeFieldSide[] = ['survivor', 'absorbed'];

class MergeLeadFieldChoicesDto implements LeadMergeFieldChoices {
  @IsOptional()
  @IsIn(SIDES)
  name?: LeadMergeFieldSide;

  @IsOptional()
  @IsIn(SIDES)
  contactName?: LeadMergeFieldSide;

  @IsOptional()
  @IsIn(SIDES)
  phone?: LeadMergeFieldSide;

  @IsOptional()
  @IsIn(SIDES)
  email?: LeadMergeFieldSide;

  @IsOptional()
  @IsIn(SIDES)
  assignedTo?: LeadMergeFieldSide;

  @IsOptional()
  @IsIn(SIDES)
  source?: LeadMergeFieldSide;

  @IsOptional()
  @IsIn(SIDES)
  sourceDetail?: LeadMergeFieldSide;

  @IsOptional()
  @IsIn(SIDES)
  sourcePartnerId?: LeadMergeFieldSide;

  @IsOptional()
  @IsIn(SIDES)
  sourceContactId?: LeadMergeFieldSide;

  @IsOptional()
  @IsIn(SIDES)
  marketingAccountId?: LeadMergeFieldSide;

  @IsOptional()
  @IsIn(SIDES)
  marketingActivityId?: LeadMergeFieldSide;
}

export class MergeLeadDto {
  @IsUUID()
  absorbedId!: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => MergeLeadFieldChoicesDto)
  fieldChoices?: MergeLeadFieldChoicesDto;

  @IsOptional()
  @IsString()
  @IsIn([...LEAD_MERGE_ALLOWED_STATUS_OVERRIDES])
  status?: string;
}
