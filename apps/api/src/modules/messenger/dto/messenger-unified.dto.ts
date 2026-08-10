import { IsArray, IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength, ValidateIf } from 'class-validator';

const ENSURE_TYPES = ['PROJECT_GENERAL', 'PRODUCT', 'DEAL', 'TASK', 'DIRECT'] as const;

export class EnsureMessengerConversationDto {
  @IsIn(ENSURE_TYPES)
  type!: (typeof ENSURE_TYPES)[number];

  /** Required for entity conversation types. */
  @ValidateIf((o: EnsureMessengerConversationDto) => o.type !== 'DIRECT')
  @IsUUID()
  entityId?: string;

  /** Required when type is DIRECT. */
  @ValidateIf((o: EnsureMessengerConversationDto) => o.type === 'DIRECT')
  @IsUUID()
  peerEmployeeId?: string;
}

export class SendMessengerConversationMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(10_000)
  content!: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  fileAssetIds?: string[];
}
