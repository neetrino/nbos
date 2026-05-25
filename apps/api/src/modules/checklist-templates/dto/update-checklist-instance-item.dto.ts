import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateChecklistInstanceItemDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  itemId!: string;

  @IsIn(['PENDING', 'DONE', 'NOT_DONE'])
  mark!: 'PENDING' | 'DONE' | 'NOT_DONE';

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
