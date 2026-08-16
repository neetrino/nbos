import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  ACCOUNT_PASSWORD_COMPLEXITY,
  ACCOUNT_PASSWORD_COMPLEXITY_MESSAGE,
  ACCOUNT_PASSWORD_MAX_LENGTH,
  ACCOUNT_PASSWORD_MIN_LENGTH,
} from '../auth-password.policy';

export class AcceptInviteDto {
  @ApiProperty({ description: 'Invitation token from the invite link' })
  @IsString()
  token!: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName!: string;

  @ApiProperty({ minLength: ACCOUNT_PASSWORD_MIN_LENGTH })
  @IsString()
  @MinLength(ACCOUNT_PASSWORD_MIN_LENGTH)
  @MaxLength(ACCOUNT_PASSWORD_MAX_LENGTH)
  @Matches(ACCOUNT_PASSWORD_COMPLEXITY, {
    message: ACCOUNT_PASSWORD_COMPLEXITY_MESSAGE,
  })
  password!: string;
}
