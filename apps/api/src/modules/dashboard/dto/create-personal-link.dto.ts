import { ArrayMaxSize, IsArray, IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePersonalLinkDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  label?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  url?: string;

  @IsOptional()
  @IsBoolean()
  openInNewTab?: boolean;
}

export class CreatePersonalLinkDto {
  @IsString()
  @MaxLength(60)
  label!: string;

  @IsString()
  @MaxLength(500)
  url!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(2)
  placement?: string[];

  @IsOptional()
  @IsBoolean()
  openInNewTab?: boolean;
}
