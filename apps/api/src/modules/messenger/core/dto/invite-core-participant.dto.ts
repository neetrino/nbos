import { ApiProperty } from '@nestjs/swagger';
import { MessengerParticipantRole } from '@nbos/database';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class InviteCoreParticipantDto {
  @ApiProperty()
  @IsString()
  employeeId!: string;

  @ApiProperty({ enum: MessengerParticipantRole, required: false })
  @IsOptional()
  @IsEnum(MessengerParticipantRole)
  role?: (typeof MessengerParticipantRole)[keyof typeof MessengerParticipantRole];
}
