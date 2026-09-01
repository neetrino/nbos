import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import {
  EMPLOYEE_OWN_AVATAR_MAX_LENGTH,
  EMPLOYEE_OWN_NAME_MAX_LENGTH,
  EMPLOYEE_OWN_PHONE_MAX_LENGTH,
  EMPLOYEE_OWN_SIP_ID_MAX_LENGTH,
  EMPLOYEE_OWN_TELEGRAM_MAX_LENGTH,
} from '../employee-own-profile.constants';

/**
 * Self-service profile fields. Work email, hire date, role, level, status,
 * position, departments and notes stay on COMPANY:EDIT.
 */
export class UpdateOwnProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(EMPLOYEE_OWN_NAME_MAX_LENGTH)
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(EMPLOYEE_OWN_NAME_MAX_LENGTH)
  lastName?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @MaxLength(EMPLOYEE_OWN_PHONE_MAX_LENGTH)
  phone?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @MaxLength(EMPLOYEE_OWN_TELEGRAM_MAX_LENGTH)
  telegram?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @MaxLength(EMPLOYEE_OWN_SIP_ID_MAX_LENGTH)
  sipId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @MaxLength(EMPLOYEE_OWN_AVATAR_MAX_LENGTH)
  avatar?: string | null;

  @ApiPropertyOptional({ nullable: true, format: 'date-time' })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null && value !== '')
  @IsDateString()
  birthday?: string | null;
}
