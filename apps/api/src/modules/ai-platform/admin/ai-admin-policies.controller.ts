import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  type CurrentUserPayload,
  RequirePermission,
} from '../../../common/decorators';
import { AiModelPolicyService } from '../policies/ai-model-policy.service';
import {
  AI_ADMIN_PERMISSION_ACTION,
  AI_ADMIN_PERMISSION_MODULE,
  AI_ADMIN_ROUTE_PREFIX,
} from './ai-admin.constants';
import { CreateModelPolicyDto, ReplacePolicyCandidatesDto } from './dto/create-policy.dto';

@ApiTags('AI Admin')
@ApiBearerAuth()
@RequirePermission(AI_ADMIN_PERMISSION_MODULE, AI_ADMIN_PERMISSION_ACTION)
@Controller(`${AI_ADMIN_ROUTE_PREFIX}/model-policies`)
export class AiAdminPoliciesController {
  constructor(private readonly policies: AiModelPolicyService) {}

  @Get()
  @ApiOperation({ summary: 'List Model Policies (FIXED / PRIMARY_FALLBACK)' })
  list() {
    return this.policies.listAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a Phase 1 Model Policy' })
  create(@CurrentUser() user: CurrentUserPayload, @Body() body: CreateModelPolicyDto) {
    return this.policies.create(body, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Model Policy detail' })
  async getById(@Param('id') id: string) {
    const policy = await this.policies.findById(id);
    if (!policy) {
      throw new NotFoundException('Model policy not found');
    }
    return policy;
  }

  @Post(':id/candidates')
  @ApiOperation({ summary: 'Replace policy candidates (version increments)' })
  replaceCandidates(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: ReplacePolicyCandidatesDto,
  ) {
    return this.policies.replaceCandidates(id, body.candidates, user.id);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate a Model Policy' })
  activate(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.policies.activate(id, user.id);
  }

  @Post(':id/disable')
  @ApiOperation({ summary: 'Disable a Model Policy' })
  disable(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.policies.disable(id, user.id);
  }
}
