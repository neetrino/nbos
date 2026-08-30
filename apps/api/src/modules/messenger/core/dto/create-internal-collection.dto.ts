import { ApiProperty } from '@nestjs/swagger';
import { MessengerCollectionVisibility } from '@nbos/database';
import { IsEnum, IsString, MaxLength } from 'class-validator';

export class CreateInternalCollectionDto {
  @ApiProperty({ maxLength: 120 })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ enum: MessengerCollectionVisibility })
  @IsEnum(MessengerCollectionVisibility)
  visibility!: (typeof MessengerCollectionVisibility)[keyof typeof MessengerCollectionVisibility];
}
