import { Body, Controller, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  type CurrentUserPayload,
  RequirePermission,
} from '../../../common/decorators';
import { AiPromptPolicyService } from '../prompts/ai-prompt-policy.service';
import {
  AI_ADMIN_PERMISSION_ACTION,
  AI_ADMIN_PERMISSION_MODULE,
  AI_ADMIN_ROUTE_PREFIX,
} from './ai-admin.constants';
import {
  CreatePromptPolicyDto,
  CreatePromptVersionDto,
  RollbackPromptPolicyDto,
} from './dto/create-prompt-policy.dto';

@ApiTags('AI Admin')
@ApiBearerAuth()
@RequirePermission(AI_ADMIN_PERMISSION_MODULE, AI_ADMIN_PERMISSION_ACTION)
@Controller(`${AI_ADMIN_ROUTE_PREFIX}/prompt-policies`)
export class AiAdminPromptPoliciesController {
  constructor(private readonly prompts: AiPromptPolicyService) {}

  @Get()
  @ApiOperation({ summary: 'List Prompt Policies' })
  list() {
    return this.prompts.listAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a Prompt Policy with a DRAFT version' })
  create(@CurrentUser() user: CurrentUserPayload, @Body() body: CreatePromptPolicyDto) {
    return this.prompts.create(
      { name: body.name, purpose: body.purpose, ownerId: user.id, layers: body.layers },
      user.id,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Prompt Policy detail, including versions' })
  async getById(@Param('id') id: string) {
    const policy = await this.prompts.findById(id);
    if (!policy) {
      throw new NotFoundException('Prompt policy not found');
    }
    return policy;
  }

  @Post(':id/versions')
  @ApiOperation({ summary: 'Create a DRAFT prompt version' })
  createVersion(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: CreatePromptVersionDto,
  ) {
    return this.prompts.createVersion(id, body.layers, user.id);
  }

  @Patch(':id/versions/:versionId')
  @ApiOperation({ summary: 'Edit a DRAFT prompt version' })
  updateDraft(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @Body() body: CreatePromptVersionDto,
  ) {
    return this.prompts.updateDraft(id, versionId, body.layers, user.id);
  }

  @Post(':id/versions/:versionId/testing')
  @ApiOperation({ summary: 'Move a DRAFT prompt version to TESTING' })
  markTesting(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('versionId') versionId: string,
  ) {
    return this.prompts.markTesting(id, versionId, user.id);
  }

  @Post(':id/versions/:versionId/publish')
  @ApiOperation({ summary: 'Publish a prompt version and retire the previous published one' })
  publish(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('versionId') versionId: string,
  ) {
    return this.prompts.publish(id, versionId, user.id);
  }

  @Post(':id/rollback')
  @ApiOperation({ summary: 'Rollback by publishing a clone of a previous version' })
  rollback(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: RollbackPromptPolicyDto,
  ) {
    return this.prompts.rollback(id, body.versionId, user.id);
  }
}
