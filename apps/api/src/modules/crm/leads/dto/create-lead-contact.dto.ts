import { Type } from 'class-transformer';
import { IsIn, IsObject, IsOptional, IsUUID, ValidateNested } from 'class-validator';

export const LEAD_CREATE_CONTACT_ATTACH_TYPES = ['deal', 'project', 'product', 'lead'] as const;

export type LeadCreateContactAttachType = (typeof LEAD_CREATE_CONTACT_ATTACH_TYPES)[number];

export class CreateLeadContactAttachDto {
  @IsIn(LEAD_CREATE_CONTACT_ATTACH_TYPES)
  type!: LeadCreateContactAttachType;

  @IsUUID()
  id!: string;
}

export class CreateLeadContactDto {
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CreateLeadContactAttachDto)
  attach?: CreateLeadContactAttachDto;
}
