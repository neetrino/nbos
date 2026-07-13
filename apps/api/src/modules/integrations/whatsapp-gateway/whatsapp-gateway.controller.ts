import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  RequirePermission,
  type CurrentUserPayload,
} from '../../../common/decorators';
import { UpsertWhatsAppGatewayConnectionDto } from './dto/whatsapp-gateway.dto';
import { WhatsAppGatewayConnectionService } from './whatsapp-gateway-connection.service';

@ApiTags('Integrations / WhatsApp Gateway')
@ApiBearerAuth()
@Controller('integrations/whatsapp-gateway')
export class WhatsAppGatewayController {
  constructor(private readonly connection: WhatsAppGatewayConnectionService) {}

  @Get()
  @RequirePermission('COMPANY', 'EDIT')
  @ApiOperation({ summary: 'Get WhatsApp Gateway connection (no secrets)' })
  getConnection() {
    return this.connection.getPublicView();
  }

  @Put()
  @RequirePermission('COMPANY', 'EDIT')
  @ApiOperation({ summary: 'Configure WhatsApp Gateway URL and/or API token' })
  upsert(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: UpsertWhatsAppGatewayConnectionDto,
  ) {
    return this.connection.upsertConnection(body, user.id);
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('COMPANY', 'EDIT')
  @ApiOperation({ summary: 'Test WhatsApp Gateway health and token' })
  test() {
    return this.connection.testConnection();
  }

  @Delete()
  @RequirePermission('COMPANY', 'EDIT')
  @ApiOperation({ summary: 'Disconnect WhatsApp Gateway (clears token)' })
  disconnect(@CurrentUser() user: CurrentUserPayload) {
    return this.connection.disconnect(user.id);
  }
}
