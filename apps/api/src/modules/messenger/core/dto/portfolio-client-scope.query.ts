import { IsOptional, IsUUID } from 'class-validator';

export class PortfolioClientScopeQueryDto {
  @IsOptional()
  @IsUUID()
  contactId?: string;

  @IsOptional()
  @IsUUID()
  companyId?: string;
}
