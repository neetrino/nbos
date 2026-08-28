import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  WHATSAPP_GATEWAY_DIRECTORY_PAGE_SIZE_MAX,
  WHATSAPP_GATEWAY_DIRECTORY_SEARCH_MAX_LENGTH,
} from '../whatsapp-gateway.constants';

export class UpsertWhatsAppGatewayConnectionDto {
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(500)
  baseUrl?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(500)
  apiToken?: string;

  /** Accountant WhatsApp group JID; empty string clears. */
  @IsOptional()
  @IsString()
  @MaxLength(128)
  accountingGroupChatId?: string | null;
}

export class BindProductWhatsAppGroupDto {
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  groupChatId!: string;

  @IsOptional()
  @IsBoolean()
  replace?: boolean;

  /** Won/ID path: persist the id when Gateway/WAHA is unreachable. */
  @IsOptional()
  @IsBoolean()
  persistIfUnreachable?: boolean;
}

export class ResendWhatsAppClientInviteDto {
  @IsOptional()
  @IsBoolean()
  forceResend?: boolean;
}

export class ListWhatsAppGatewayGroupsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(WHATSAPP_GATEWAY_DIRECTORY_PAGE_SIZE_MAX)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @IsOptional()
  @IsString()
  @MaxLength(WHATSAPP_GATEWAY_DIRECTORY_SEARCH_MAX_LENGTH)
  search?: string;
}
