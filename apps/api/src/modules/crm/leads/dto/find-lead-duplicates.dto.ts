import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class FindLeadDuplicatesDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  instagramUsername?: string;

  @IsOptional()
  @IsUUID()
  excludeId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;
}
