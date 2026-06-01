import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** Account-creation password: length + at least one letter and one digit. */
const PASSWORD_MIN_LENGTH = 10;
const PASSWORD_MAX_LENGTH = 128;
const PASSWORD_COMPLEXITY = /^(?=.*[A-Za-z])(?=.*\d).+$/;

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

  @ApiProperty({ minLength: PASSWORD_MIN_LENGTH })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  @Matches(PASSWORD_COMPLEXITY, {
    message: 'password must contain at least one letter and one number',
  })
  password!: string;
}
