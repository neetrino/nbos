import { IsBoolean, IsIn, IsOptional, IsUUID } from 'class-validator';
import {
  DEPARTMENT_ROLE_DEPUTY,
  DEPARTMENT_ROLE_HEAD,
  DEPARTMENT_ROLE_MEMBER,
} from '../departments/department-member.constants';

const DEPT_ROLES = [DEPARTMENT_ROLE_HEAD, DEPARTMENT_ROLE_DEPUTY, DEPARTMENT_ROLE_MEMBER] as const;

export type EmployeeDeptRole = (typeof DEPT_ROLES)[number];

export class AddEmployeeDepartmentDto {
  @IsUUID()
  departmentId!: string;

  @IsOptional()
  @IsIn(DEPT_ROLES)
  deptRole?: EmployeeDeptRole;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class UpdateEmployeeDepartmentDto {
  @IsOptional()
  @IsIn(DEPT_ROLES)
  deptRole?: EmployeeDeptRole;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
