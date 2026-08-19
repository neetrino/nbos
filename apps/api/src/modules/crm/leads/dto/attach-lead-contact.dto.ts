import { IsOptional, IsUUID } from 'class-validator';

export class AttachLeadContactDto {
  @IsUUID()
  contactId!: string;

  @IsOptional()
  @IsUUID()
  aboutDealId?: string;
}
