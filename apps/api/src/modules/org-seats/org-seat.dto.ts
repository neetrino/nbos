import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

const SEAT_KINDS = ['HEAD', 'DEPUTY', 'STANDARD'] as const;
const ASSIGNMENT_STATUSES = ['ACTIVE'] as const;
/** Role.id is a UUID in schema defaults, but existing rows use slug ids such as `role-seller`. */
const PERMISSION_ROLE_ID_MAX_LENGTH = 64;

function emptyToNull(value: unknown): unknown {
  return typeof value === 'string' && value.trim() === '' ? null : value;
}

export class ListOrgSeatsQueryDto {
  @IsOptional()
  @IsUUID()
  departmentId?: string;
}

export class CreateOrgSeatDto {
  @IsUUID()
  departmentId!: string;

  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MinLength(1)
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToNull(value))
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @MinLength(1)
  @MaxLength(PERMISSION_ROLE_ID_MAX_LENGTH)
  defaultPermissionRoleId?: string | null;

  @IsOptional()
  @IsIn(SEAT_KINDS)
  kind?: (typeof SEAT_KINDS)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

export class UpdateOrgSeatDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MinLength(1)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @IsOptional()
  @Transform(({ value }) => emptyToNull(value))
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @MinLength(1)
  @MaxLength(PERMISSION_ROLE_ID_MAX_LENGTH)
  defaultPermissionRoleId?: string | null;

  @IsOptional()
  @IsIn(SEAT_KINDS)
  kind?: (typeof SEAT_KINDS)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

export class AssignOrgSeatDto {
  @IsUUID()
  employeeId!: string;

  @IsOptional()
  @IsIn(ASSIGNMENT_STATUSES)
  status?: (typeof ASSIGNMENT_STATUSES)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  allocationPct?: number;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class EndOrgSeatAssignmentDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class PreviewOrgSeatDto {
  @IsUUID()
  employeeId!: string;

  @IsIn(['ASSIGN', 'END'])
  operation!: 'ASSIGN' | 'END';
}
