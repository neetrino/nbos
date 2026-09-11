import { ApiProperty } from '@nestjs/swagger';
import { MessengerCollectionVisibility, MessengerConversationZone } from '@nbos/database';
import { IsEnum, IsString, MaxLength } from 'class-validator';

export class CreateCoreCollectionDto {
  @ApiProperty({ maxLength: 120 })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ enum: MessengerCollectionVisibility })
  @IsEnum(MessengerCollectionVisibility)
  visibility!: (typeof MessengerCollectionVisibility)[keyof typeof MessengerCollectionVisibility];

  @ApiProperty({ enum: MessengerConversationZone })
  @IsEnum(MessengerConversationZone)
  zone!: (typeof MessengerConversationZone)[keyof typeof MessengerConversationZone];
}
