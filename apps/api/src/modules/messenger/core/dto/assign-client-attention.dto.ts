import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import {
  MESSENGER_ATTENTION_OWNER_EMPLOYEE,
  MESSENGER_ATTENTION_OWNER_QUEUE,
  MESSENGER_ATTENTION_OWNER_ROLE,
  MESSENGER_ATTENTION_QUEUE_FINANCE,
  MESSENGER_ATTENTION_QUEUE_SUPPORT_INTAKE,
} from '../messenger-core-attention.constants';
import { PRODUCT_COMMUNICATION_PURPOSES } from '../product-communication.constants';

export class AssignClientAttentionDto {
  @ApiProperty()
  @IsString()
  productId!: string;

  @ApiProperty({ enum: PRODUCT_COMMUNICATION_PURPOSES })
  @IsIn([...PRODUCT_COMMUNICATION_PURPOSES])
  purpose!: (typeof PRODUCT_COMMUNICATION_PURPOSES)[number];

  @ApiProperty({
    enum: [
      MESSENGER_ATTENTION_OWNER_EMPLOYEE,
      MESSENGER_ATTENTION_OWNER_QUEUE,
      MESSENGER_ATTENTION_OWNER_ROLE,
    ],
  })
  @IsIn([
    MESSENGER_ATTENTION_OWNER_EMPLOYEE,
    MESSENGER_ATTENTION_OWNER_QUEUE,
    MESSENGER_ATTENTION_OWNER_ROLE,
  ])
  ownerKind!: 'EMPLOYEE' | 'QUEUE' | 'ROLE';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  ownerEmployeeId?: string;

  @ApiProperty({
    required: false,
    enum: [MESSENGER_ATTENTION_QUEUE_SUPPORT_INTAKE, MESSENGER_ATTENTION_QUEUE_FINANCE],
  })
  @IsOptional()
  @IsIn([MESSENGER_ATTENTION_QUEUE_SUPPORT_INTAKE, MESSENGER_ATTENTION_QUEUE_FINANCE])
  ownerQueue?: 'SUPPORT_INTAKE' | 'FINANCE';
}
