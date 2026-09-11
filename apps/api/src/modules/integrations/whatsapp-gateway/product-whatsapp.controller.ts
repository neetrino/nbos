import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  RequirePermission,
  type CurrentUserPayload,
} from '../../../common/decorators';
import {
  BindProductWhatsAppGroupDto,
  ResendWhatsAppClientInviteDto,
} from './dto/whatsapp-gateway.dto';
import { ProductWhatsAppGroupService } from './product-whatsapp-group.service';

@ApiTags('Projects / Product WhatsApp')
@ApiBearerAuth()
@Controller('projects/products/:productId/whatsapp')
export class ProductWhatsAppController {
  constructor(private readonly productWhatsApp: ProductWhatsAppGroupService) {}

  @Get()
  @RequirePermission('PROJECTS', 'VIEW')
  @ApiOperation({ summary: 'Get Product WhatsApp group state' })
  getState(@Param('productId') productId: string) {
    return this.productWhatsApp.getProductWhatsAppState(productId);
  }

  @Post('ensure')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('PROJECTS', 'EDIT')
  @ApiOperation({ summary: 'Ensure Product WhatsApp group (enqueue)' })
  ensure(
    @Param('productId') productId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Query('purpose') purpose?: 'WORK' | 'FINANCE',
  ) {
    return this.productWhatsApp.ensureGroupForProduct(productId, {
      source: 'MANUAL_RETRY',
      actorId: user.id,
      purpose: purpose === 'FINANCE' ? 'FINANCE' : 'WORK',
    });
  }

  @Get('available-groups')
  @RequirePermission('PROJECTS', 'EDIT')
  @ApiOperation({ summary: 'List Gateway groups available for this Product' })
  availableGroups(
    @Param('productId') productId: string,
    @Query('search') search?: string,
    @Query('purpose') purpose?: 'WORK' | 'FINANCE',
  ) {
    return this.productWhatsApp.listAvailableGroups(
      productId,
      search,
      purpose === 'FINANCE' ? 'FINANCE' : 'WORK',
    );
  }

  @Put('binding')
  @RequirePermission('PROJECTS', 'EDIT')
  @ApiOperation({ summary: 'Bind or replace Product WhatsApp destination' })
  bind(
    @Param('productId') productId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: BindProductWhatsAppGroupDto,
  ) {
    return this.productWhatsApp.bindExistingGroup(productId, body.groupChatId, user.id, {
      replace: body.replace,
      persistIfUnreachable: body.persistIfUnreachable,
      purpose: body.purpose === 'FINANCE' ? 'FINANCE' : 'WORK',
    });
  }

  @Post('finance/use-work')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('PROJECTS', 'EDIT')
  @ApiOperation({ summary: 'Clear explicit FINANCE destination (fall back to WORK)' })
  useWorkForFinance(@Param('productId') productId: string) {
    return this.productWhatsApp.useWorkForFinance(productId);
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('PROJECTS', 'EDIT')
  @ApiOperation({ summary: 'Sync Product WhatsApp participants' })
  async sync(@Param('productId') productId: string, @CurrentUser() user: CurrentUserPayload) {
    return this.productWhatsApp.syncParticipants(productId, user.id);
  }

  @Post('client-invite')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('PROJECTS', 'EDIT')
  @ApiOperation({ summary: 'Queue client WhatsApp invitation' })
  invite(
    @Param('productId') productId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: ResendWhatsAppClientInviteDto,
  ) {
    return this.productWhatsApp.queueClientInvitation(productId, user.id, {
      forceResend: body.forceResend,
    });
  }

  @Get('operations')
  @RequirePermission('PROJECTS', 'VIEW')
  @ApiOperation({ summary: 'List Product WhatsApp operations' })
  operations(@Param('productId') productId: string) {
    return this.productWhatsApp.listOperations(productId);
  }
}
