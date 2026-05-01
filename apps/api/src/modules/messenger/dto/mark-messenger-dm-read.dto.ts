import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class MarkMessengerDmReadDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  recipientId!: string;
}
