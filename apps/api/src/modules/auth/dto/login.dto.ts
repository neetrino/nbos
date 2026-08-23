import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AUTH_SESSION_CLIENT_KINDS } from '@nbos/shared';

export class LoginDto {
  @ApiProperty({ example: 'employee@company.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'strongPassword123' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({ enum: AUTH_SESSION_CLIENT_KINDS })
  @IsOptional()
  @IsIn([...AUTH_SESSION_CLIENT_KINDS])
  clientKind?: (typeof AUTH_SESSION_CLIENT_KINDS)[number];

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  deviceLabel?: string;
}
