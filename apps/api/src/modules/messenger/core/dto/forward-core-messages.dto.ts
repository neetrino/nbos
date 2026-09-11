import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsString } from 'class-validator';
import { MESSENGER_CORE_FORWARD_SOURCE_MAX_COUNT } from '../messenger-core.constants';

export class ForwardCoreMessagesDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MESSENGER_CORE_FORWARD_SOURCE_MAX_COUNT)
  @IsString({ each: true })
  sourceMessageIds!: string[];
}
