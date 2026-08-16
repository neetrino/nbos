import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  ACCOUNT_PASSWORD_COMPLEXITY,
  ACCOUNT_PASSWORD_COMPLEXITY_MESSAGE,
  ACCOUNT_PASSWORD_MAX_LENGTH,
  ACCOUNT_PASSWORD_MIN_LENGTH,
} from '../auth-password.policy';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Current account password' })
  @IsString()
  @MinLength(1)
  @MaxLength(ACCOUNT_PASSWORD_MAX_LENGTH)
  currentPassword!: string;

  @ApiProperty({
    minLength: ACCOUNT_PASSWORD_MIN_LENGTH,
    description: 'New password (min length + letter and digit)',
  })
  @IsString()
  @MinLength(ACCOUNT_PASSWORD_MIN_LENGTH)
  @MaxLength(ACCOUNT_PASSWORD_MAX_LENGTH)
  @Matches(ACCOUNT_PASSWORD_COMPLEXITY, {
    message: ACCOUNT_PASSWORD_COMPLEXITY_MESSAGE,
  })
  newPassword!: string;
}
