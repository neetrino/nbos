import { IsString, MinLength } from 'class-validator';

export class AssignThreadDto {
  @IsString()
  @MinLength(1)
  employeeId!: string;
}
