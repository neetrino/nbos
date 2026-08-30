import { ApiProperty } from '@nestjs/swagger';
import { MessengerLinkEntityType, MessengerLinkRelationType } from '@nbos/database';
import { IsEnum, IsString } from 'class-validator';

export class CreateCoreLinkDto {
  @ApiProperty({ enum: MessengerLinkEntityType })
  @IsEnum(MessengerLinkEntityType)
  entityType!: (typeof MessengerLinkEntityType)[keyof typeof MessengerLinkEntityType];

  @ApiProperty()
  @IsString()
  entityId!: string;

  @ApiProperty({ enum: MessengerLinkRelationType })
  @IsEnum(MessengerLinkRelationType)
  relationType!: (typeof MessengerLinkRelationType)[keyof typeof MessengerLinkRelationType];
}
