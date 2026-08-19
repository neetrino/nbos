import { IsUUID } from 'class-validator';

export class PourLeadIntoContactDto {
  @IsUUID()
  contactId!: string;
}
