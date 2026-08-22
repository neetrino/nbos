import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { isAiModelStatus, type AiModelStatus } from '@nbos/shared';
import {
  CurrentUser,
  type CurrentUserPayload,
  RequirePermission,
} from '../../../common/decorators';
import { AiModelCatalogService } from '../models/ai-model-catalog.service';
import { AiModelSyncService } from '../models/ai-model-sync.service';
import {
  AI_ADMIN_PERMISSION_ACTION,
  AI_ADMIN_PERMISSION_MODULE,
  AI_ADMIN_ROUTE_PREFIX,
} from './ai-admin.constants';
import { UpdateModelDto } from './dto/update-model.dto';

@ApiTags('AI Admin')
@ApiBearerAuth()
@RequirePermission(AI_ADMIN_PERMISSION_MODULE, AI_ADMIN_PERMISSION_ACTION)
@Controller(`${AI_ADMIN_ROUTE_PREFIX}/models`)
export class AiAdminModelsController {
  constructor(
    private readonly catalog: AiModelCatalogService,
    private readonly sync: AiModelSyncService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List catalog models; DISCOVERED is not production-active' })
  list(@Query('connectionId') connectionId?: string, @Query('status') status?: string) {
    if (status && !isAiModelStatus(status)) {
      throw new BadRequestException('Unknown model status');
    }
    const statusFilter = status && isAiModelStatus(status) ? (status as AiModelStatus) : undefined;
    return this.catalog.listAll({ connectionId, status: statusFilter });
  }

  @Post('sync-all')
  @ApiOperation({ summary: 'Sync every enabled provider connection' })
  syncAll(@CurrentUser() user: CurrentUserPayload) {
    return this.sync.syncAllEnabledConnections(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Model detail' })
  async getById(@Param('id') id: string) {
    const model = await this.catalog.findById(id);
    if (!model) {
      throw new NotFoundException('Model not found');
    }
    return model;
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Explicitly activate a model for production assignment' })
  activate(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.catalog.activate(id, user.id);
  }

  @Post(':id/disable')
  @ApiOperation({ summary: 'Disable a model' })
  disable(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.catalog.disable(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update internal suitability tags/notes (not provider metadata)' })
  update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: UpdateModelDto,
  ) {
    return this.catalog.updateSuitability(id, body, user.id);
  }
}
