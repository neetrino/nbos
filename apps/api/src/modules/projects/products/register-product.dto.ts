import { BadRequestException } from '@nestjs/common';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  validateSync,
} from 'class-validator';

/** Registration can create a project/company, but never creates a commercial order. */
export class RegisterProductDto {
  @IsString() @MinLength(1) @MaxLength(200) name!: string;
  @IsString() productCategory!: string;
  @IsString() productType!: string;
  @IsOptional() @IsString() productPlatform?: string | null;
  @IsBoolean() startDelivery!: boolean;
  @IsOptional() @IsUUID() projectId?: string;
  @IsOptional() @IsBoolean() createProject?: boolean;
  @IsUUID() contactId!: string;
  @IsOptional() @IsUUID() companyId?: string | null;
  @IsOptional() @IsBoolean() createCompany?: boolean;
  @IsOptional() @IsIn(['TAX', 'TAX_FREE']) taxStatus?: 'TAX' | 'TAX_FREE';
  @IsOptional() @IsString() @MaxLength(10000) description?: string;
}

export function parseRegisterProduct(input: RegisterProductDto): RegisterProductDto {
  const data = Object.assign(new RegisterProductDto(), input);
  if (typeof data.name === 'string') data.name = data.name.trim();
  const errors = validateSync(data, { whitelist: true, forbidNonWhitelisted: true });
  if (errors.length) throw new BadRequestException(errors.map((error) => error.constraints));
  if (Boolean(data.projectId) === Boolean(data.createProject)) {
    throw new BadRequestException('Choose an existing project or create a new one');
  }
  if (data.companyId && data.createCompany) {
    throw new BadRequestException('Choose an existing company or create a new one');
  }
  return data;
}
