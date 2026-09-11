import { ApiProperty } from '@nestjs/swagger';
import { MessengerConversationType, MessengerConversationZone } from '@nbos/database';
import { IsArray, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCoreConversationDto {
  @ApiProperty({ enum: MessengerConversationZone })
  @IsEnum(MessengerConversationZone)
  zone!: (typeof MessengerConversationZone)[keyof typeof MessengerConversationZone];

  @ApiProperty({ enum: MessengerConversationType })
  @IsEnum(MessengerConversationType)
  type!: (typeof MessengerConversationType)[keyof typeof MessengerConversationType];

  @ApiProperty({ required: false, maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiProperty({ required: false, description: 'Peer employee id for DIRECT conversations' })
  @IsOptional()
  @IsString()
  peerEmployeeId?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  participantIds?: string[];
}
