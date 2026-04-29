import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import {
  MESSENGER_MESSAGE_BODY_MAX_LENGTH,
  MESSENGER_USER_ID_PARAM_MAX_LENGTH,
} from '../messenger.constants';

export class SendMessengerDmDto {
  @ApiProperty({ maxLength: MESSENGER_USER_ID_PARAM_MAX_LENGTH })
  @IsString()
  @IsNotEmpty()
  @MaxLength(MESSENGER_USER_ID_PARAM_MAX_LENGTH)
  recipientId!: string;

  @ApiProperty({ maxLength: MESSENGER_MESSAGE_BODY_MAX_LENGTH })
  @IsString()
  @IsNotEmpty()
  @MaxLength(MESSENGER_MESSAGE_BODY_MAX_LENGTH)
  content!: string;
}
