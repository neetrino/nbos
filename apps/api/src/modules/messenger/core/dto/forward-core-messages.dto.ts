import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { MESSENGER_MESSAGE_BODY_MAX_LENGTH } from '../../messenger.constants';
import { MESSENGER_CORE_FORWARD_SOURCE_MAX_COUNT } from '../messenger-core.constants';

export class ForwardCoreMessagesDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MESSENGER_CORE_FORWARD_SOURCE_MAX_COUNT)
  @IsString({ each: true })
  sourceMessageIds!: string[];

  @ApiProperty({ required: false, maxLength: MESSENGER_MESSAGE_BODY_MAX_LENGTH })
  @IsOptional()
  @IsString()
  @MaxLength(MESSENGER_MESSAGE_BODY_MAX_LENGTH)
  comment?: string;
}
