import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateChecklistInstanceDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  ownerEntityType!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(64)
  ownerEntityId!: string;
}
