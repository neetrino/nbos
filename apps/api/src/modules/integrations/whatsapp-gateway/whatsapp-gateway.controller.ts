import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SETTINGS_MODULE } from '@nbos/shared';
import {
  CurrentUser,
  RequirePermission,
  type CurrentUserPayload,
} from '../../../common/decorators';
import {
  ListWhatsAppGatewayGroupsQueryDto,
  UpsertWhatsAppGatewayConnectionDto,
} from './dto/whatsapp-gateway.dto';
import { WhatsAppGatewayConnectionService } from './whatsapp-gateway-connection.service';

@ApiTags('Integrations / WhatsApp Gateway')
@ApiBearerAuth()
@Controller('integrations/whatsapp-gateway')
export class WhatsAppGatewayController {
  constructor(private readonly connection: WhatsAppGatewayConnectionService) {}

  @Get()
  @RequirePermission(SETTINGS_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Get WhatsApp Gateway connection (no secrets)' })
  getConnection() {
    return this.connection.getPublicView();
  }

  // Unscoped, company-wide Gateway directory: only the Settings -> Integrations browse sheet
  // uses it. Deal and product chat binding go through their own scoped `available-groups`
  // endpoints, so these must not be opened up to CRM roles.
  @Get('chats')
  @RequirePermission(SETTINGS_MODULE, 'EDIT')
  @ApiOperation({
    summary: 'List WhatsApp chats (groups + personal) from the connected Gateway',
  })
  listChats(@Query() query: ListWhatsAppGatewayGroupsQueryDto) {
    return this.connection.listChats(query);
  }

  @Get('groups')
  @RequirePermission(SETTINGS_MODULE, 'EDIT')
  @ApiOperation({ summary: 'List WhatsApp groups from the connected Gateway' })
  listGroups(@Query() query: ListWhatsAppGatewayGroupsQueryDto) {
    return this.connection.listGroups(query);
  }

  @Put()
  @RequirePermission(SETTINGS_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Configure WhatsApp Gateway URL and/or API token' })
  upsert(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: UpsertWhatsAppGatewayConnectionDto,
  ) {
    return this.connection.upsertConnection(body, user.id);
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(SETTINGS_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Test WhatsApp Gateway health and token' })
  test() {
    return this.connection.testConnection();
  }

  @Delete()
  @RequirePermission(SETTINGS_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Disconnect WhatsApp Gateway (clears token)' })
  disconnect(@CurrentUser() user: CurrentUserPayload) {
    return this.connection.disconnect(user.id);
  }
}
