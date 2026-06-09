import { IsEnum, IsString, MinLength } from 'class-validator';

export enum MailAccountAccessRoleDto {
  ADMIN = 'ADMIN',
  READER = 'READER',
  SENDER = 'SENDER',
}

export class ShareMailAccountDto {
  @IsString()
  @MinLength(1)
  employeeId!: string;

  @IsEnum(MailAccountAccessRoleDto)
  role!: MailAccountAccessRoleDto;
}

export class UpdateMailAccountAccessDto {
  @IsEnum(MailAccountAccessRoleDto)
  role!: MailAccountAccessRoleDto;
}
