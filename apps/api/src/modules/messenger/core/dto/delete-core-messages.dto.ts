import { ArrayMaxSize, ArrayMinSize, IsArray, IsUUID } from 'class-validator';

const DELETE_CORE_MESSAGES_MAX = 50;

export class DeleteCoreMessagesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(DELETE_CORE_MESSAGES_MAX)
  @IsUUID('4', { each: true })
  messageIds!: string[];
}
