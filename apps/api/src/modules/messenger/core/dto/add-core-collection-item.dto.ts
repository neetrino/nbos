import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AddCoreCollectionItemDto {
  @ApiProperty()
  @IsString()
  conversationId!: string;
}

export class AddCoreCollectionMemberDto {
  @ApiProperty()
  @IsString()
  employeeId!: string;
}
