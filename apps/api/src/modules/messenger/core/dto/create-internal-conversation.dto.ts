import { ApiProperty } from '@nestjs/swagger';
import { MessengerConversationType } from '@nbos/database';
import { IsArray, IsEnum, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const INTERNAL_CREATE_TYPES = ['INTERNAL_GROUP', 'DIRECT'] as const;

export class CreateInternalConversationDto {
  @ApiProperty({ enum: INTERNAL_CREATE_TYPES })
  @IsEnum(MessengerConversationType)
  @IsIn([...INTERNAL_CREATE_TYPES])
  type!: (typeof INTERNAL_CREATE_TYPES)[number];

  @ApiProperty({ required: false, maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  peerEmployeeId?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  participantIds?: string[];
}
