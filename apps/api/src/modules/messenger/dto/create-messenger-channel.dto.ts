import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateMessengerChannelDto {
  @ApiProperty({ maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ description: 'Project id or logical scope such as system' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  projectId!: string;

  @ApiProperty({ enum: ['project', 'general', 'announcement'] })
  @IsIn(['project', 'general', 'announcement'])
  type!: 'project' | 'general' | 'announcement';
}
