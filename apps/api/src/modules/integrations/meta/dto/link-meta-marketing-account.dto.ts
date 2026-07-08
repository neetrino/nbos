import { IsOptional, IsUUID, ValidateIf } from 'class-validator';

export class LinkMetaMarketingAccountDto {
  @IsOptional()
  @ValidateIf((_obj, value) => value !== null && value !== undefined)
  @IsUUID()
  marketingAccountId?: string | null;
}
