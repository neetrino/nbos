import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AccessLinkDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  employeeId!: string;
}
