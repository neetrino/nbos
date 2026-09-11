import { ApiProperty } from '@nestjs/swagger';
import { MessengerLinkEntityType, MessengerMessageReferencePurpose } from '@nbos/database';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateCoreReferenceDto {
  @ApiProperty()
  @IsString()
  sourceMessageId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  referencedByMessageId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  targetMessageId?: string;

  @ApiProperty({ required: false, enum: MessengerLinkEntityType })
  @IsOptional()
  @IsEnum(MessengerLinkEntityType)
  targetEntityType?: (typeof MessengerLinkEntityType)[keyof typeof MessengerLinkEntityType];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  targetEntityId?: string;

  @ApiProperty({ enum: MessengerMessageReferencePurpose })
  @IsEnum(MessengerMessageReferencePurpose)
  purpose!: (typeof MessengerMessageReferencePurpose)[keyof typeof MessengerMessageReferencePurpose];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
