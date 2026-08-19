import { Type } from 'class-transformer';
import { IsIn, IsObject, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { type ContactMergeFieldChoices, type ContactMergeFieldSide } from '@nbos/shared';

const SIDES: ContactMergeFieldSide[] = ['survivor', 'absorbed'];

class MergeContactFieldChoicesDto implements ContactMergeFieldChoices {
  @IsOptional()
  @IsIn(SIDES)
  firstName?: ContactMergeFieldSide;

  @IsOptional()
  @IsIn(SIDES)
  lastName?: ContactMergeFieldSide;

  @IsOptional()
  @IsIn(SIDES)
  phone?: ContactMergeFieldSide;

  @IsOptional()
  @IsIn(SIDES)
  email?: ContactMergeFieldSide;

  @IsOptional()
  @IsIn(SIDES)
  role?: ContactMergeFieldSide;
}

export class MergeContactDto {
  @IsUUID()
  absorbedId!: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => MergeContactFieldChoicesDto)
  fieldChoices?: MergeContactFieldChoicesDto;
}

export class FindContactMergeCandidatesDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsUUID()
  excludeId?: string;
}
