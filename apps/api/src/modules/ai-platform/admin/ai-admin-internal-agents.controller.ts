import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  type CurrentUserPayload,
  RequirePermission,
} from '../../../common/decorators';
import { InternalAgentService } from '../internal-agents/internal-agent.service';
import { AiAdminQueryService } from './ai-admin-query.service';
import {
  AI_ADMIN_PERMISSION_ACTION,
  AI_ADMIN_PERMISSION_MODULE,
  AI_ADMIN_ROUTE_PREFIX,
} from './ai-admin.constants';
import { AssignInternalAgentSurfaceDto } from './dto/assign-surface.dto';
import { CreateInternalAgentDto } from './dto/create-internal-agent.dto';
import { UpdateInternalAgentDto } from './dto/update-internal-agent.dto';

@ApiTags('AI Admin')
@ApiBearerAuth()
@RequirePermission(AI_ADMIN_PERMISSION_MODULE, AI_ADMIN_PERMISSION_ACTION)
@Controller(`${AI_ADMIN_ROUTE_PREFIX}/internal-agents`)
export class AiAdminInternalAgentsController {
  constructor(
    private readonly internalAgents: InternalAgentService,
    private readonly query: AiAdminQueryService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List Internal Agents (foundation)' })
  list() {
    return this.internalAgents.listAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create an Internal Agent in DRAFT' })
  create(@CurrentUser() user: CurrentUserPayload, @Body() body: CreateInternalAgentDto) {
    return this.internalAgents.create(
      {
        name: body.name,
        description: body.description,
        ownerId: user.id,
        environment: body.environment,
      },
      user.id,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Internal Agent detail' })
  getById(@Param('id') id: string) {
    return this.query.getInternalAgentBundle(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update Internal Agent, including Model Policy assignment' })
  update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: UpdateInternalAgentDto,
  ) {
    return this.internalAgents.update(id, body, user.id);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate through InternalAgentService (requires Model Policy)' })
  activate(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.internalAgents.activate(id, user.id);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause an Internal Agent' })
  pause(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.internalAgents.pause(id, user.id);
  }

  @Post(':id/disable')
  @ApiOperation({ summary: 'Disable an Internal Agent' })
  disable(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.internalAgents.disable(id, user.id);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive an Internal Agent' })
  archive(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.internalAgents.archive(id, user.id);
  }

  @Post(':id/surfaces')
  @ApiOperation({ summary: 'Assign or toggle a surface' })
  assignSurface(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: AssignInternalAgentSurfaceDto,
  ) {
    return this.internalAgents.assignSurface(id, body.surface, body.enabled, user.id);
  }
}
