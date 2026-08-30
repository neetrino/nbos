import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class GrantCoreAccessOverrideDto {
  @ApiProperty()
  @IsString()
  employeeId!: string;

  @ApiProperty({ enum: ['VIEW', 'EDIT'] })
  @IsIn(['VIEW', 'EDIT'])
  level!: 'VIEW' | 'EDIT';

  @ApiProperty({ required: false, maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
