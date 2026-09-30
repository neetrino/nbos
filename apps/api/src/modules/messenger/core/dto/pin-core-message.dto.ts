import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class PinCoreMessageDto {
  @ApiProperty()
  @IsUUID('4')
  messageId!: string;
}
