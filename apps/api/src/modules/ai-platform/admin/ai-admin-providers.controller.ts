import { Body, Controller, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  type CurrentUserPayload,
  RequirePermission,
} from '../../../common/decorators';
import { AiModelSyncService } from '../models/ai-model-sync.service';
import { AiProviderConnectionService } from '../providers/ai-provider-connection.service';
import {
  AI_ADMIN_PERMISSION_ACTION,
  AI_ADMIN_PERMISSION_MODULE,
  AI_ADMIN_ROUTE_PREFIX,
} from './ai-admin.constants';
import { CreateProviderConnectionDto } from './dto/create-provider.dto';
import { RotateProviderKeyDto } from './dto/rotate-provider-key.dto';
import { UpdateProviderConnectionDto } from './dto/update-provider.dto';
import { ValidateDraftProviderDto } from './dto/validate-draft-provider.dto';

@ApiTags('AI Admin')
@ApiBearerAuth()
@RequirePermission(AI_ADMIN_PERMISSION_MODULE, AI_ADMIN_PERMISSION_ACTION)
@Controller(`${AI_ADMIN_ROUTE_PREFIX}/providers`)
export class AiAdminProvidersController {
  constructor(
    private readonly connections: AiProviderConnectionService,
    private readonly sync: AiModelSyncService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List internal AI provider connections' })
  list() {
    return this.connections.listAll();
  }

  @Post('validate-draft')
  @ApiOperation({ summary: 'Validate a provider key before it is stored' })
  validateDraft(@Body() body: ValidateDraftProviderDto) {
    return this.connections.validateDraft(body);
  }

  @Post()
  @ApiOperation({ summary: 'Connect OpenAI or Anthropic (key is stored, never returned)' })
  create(@CurrentUser() user: CurrentUserPayload, @Body() body: CreateProviderConnectionDto) {
    return this.connections.create(body, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Provider connection detail (prefix only)' })
  async getById(@Param('id') id: string) {
    const connection = await this.connections.findById(id);
    if (!connection) {
      throw new NotFoundException('Provider connection not found');
    }
    return connection;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update provider connection metadata' })
  update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: UpdateProviderConnectionDto,
  ) {
    return this.connections.update(id, body, user.id);
  }

  @Post(':id/validate')
  @ApiOperation({ summary: 'Validate a provider connection without exposing the key' })
  validate(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.connections.validate(id, user.id);
  }

  @Post(':id/validate-replacement')
  @ApiOperation({ summary: 'Validate a replacement key against stored provider config' })
  validateReplacement(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: RotateProviderKeyDto,
  ) {
    return this.connections.validateReplacementKey(id, body.apiKey, user.id);
  }

  @Post(':id/rotate')
  @ApiOperation({ summary: 'Replace the provider API key' })
  rotate(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: RotateProviderKeyDto,
  ) {
    return this.connections.rotateKey(id, body.apiKey, user.id);
  }

  @Post(':id/disable')
  @ApiOperation({ summary: 'Disable a provider connection' })
  disable(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.connections.disable(id, user.id);
  }

  @Post(':id/enable')
  @ApiOperation({ summary: 'Re-enable a disabled provider connection' })
  enable(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.connections.enable(id, user.id);
  }

  @Post(':id/revoke')
  @ApiOperation({ summary: 'Revoke a provider connection and delete its secret' })
  revoke(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.connections.revoke(id, user.id);
  }

  @Post(':id/sync-models')
  @ApiOperation({ summary: 'Sync the model catalog for one connection (no auto-activate)' })
  syncModels(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.sync.syncConnection(id, user.id);
  }
}
