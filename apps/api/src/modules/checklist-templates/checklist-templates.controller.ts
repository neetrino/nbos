import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type CurrentUserPayload, RequirePermission } from '../../common/decorators';
import { ChecklistTemplatesService } from './checklist-templates.service';
import { DeliveryStageChecklistRulesService } from './delivery-stage-checklist-rules.service';
import { CreateChecklistInstanceDto } from './dto/create-checklist-instance.dto';
import { CreateChecklistTemplateDto } from './dto/create-checklist-template.dto';
import { CreateDeliveryStageChecklistRuleDto } from './dto/create-delivery-stage-checklist-rule.dto';
import { UpdateChecklistTemplateDto } from './dto/update-checklist-template.dto';
import { UpdateDeliveryStageChecklistRuleDto } from './dto/update-delivery-stage-checklist-rule.dto';
import { UpdateDraftItemsDto } from './dto/update-draft-items.dto';

@ApiTags('Checklist templates')
@ApiBearerAuth()
@Controller('checklist-templates')
export class ChecklistTemplatesController {
  constructor(
    private readonly checklistTemplatesService: ChecklistTemplatesService,
    private readonly deliveryStageChecklistRulesService: DeliveryStageChecklistRulesService,
  ) {}

  @Get()
  @RequirePermission('CHECKLIST_TEMPLATES', 'VIEW')
  @ApiOperation({ summary: 'List checklist templates' })
  findAll() {
    return this.checklistTemplatesService.findAll();
  }

  @Get('stage-rules')
  @RequirePermission('CHECKLIST_TEMPLATES', 'VIEW')
  @ApiOperation({ summary: 'List delivery stage → checklist template binding rules (CTB-2)' })
  listStageRules() {
    return this.deliveryStageChecklistRulesService.findAll();
  }

  @Get(':id/versions/:versionId')
  @RequirePermission('CHECKLIST_TEMPLATES', 'VIEW')
  @ApiOperation({ summary: 'Read-only checklist template version payload (preview)' })
  getVersionSnapshot(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
  ) {
    return this.checklistTemplatesService.getVersionSnapshot(id, versionId);
  }

  @Post('stage-rules')
  @RequirePermission('CHECKLIST_TEMPLATES', 'EDIT')
  @ApiOperation({ summary: 'Create a CHECKLIST stage requirement rule' })
  createStageRule(@Body() body: CreateDeliveryStageChecklistRuleDto) {
    return this.deliveryStageChecklistRulesService.create(body);
  }

  @Patch('stage-rules/:ruleId')
  @RequirePermission('CHECKLIST_TEMPLATES', 'EDIT')
  @ApiOperation({ summary: 'Update a delivery checklist stage rule' })
  updateStageRule(
    @Param('ruleId', ParseUUIDPipe) ruleId: string,
    @Body() body: UpdateDeliveryStageChecklistRuleDto,
  ) {
    return this.deliveryStageChecklistRulesService.update(ruleId, body);
  }

  @Delete('stage-rules/:ruleId')
  @RequirePermission('CHECKLIST_TEMPLATES', 'EDIT')
  @ApiOperation({ summary: 'Delete a delivery checklist stage rule' })
  removeStageRule(@Param('ruleId', ParseUUIDPipe) ruleId: string) {
    return this.deliveryStageChecklistRulesService.remove(ruleId);
  }

  @Get(':id')
  @RequirePermission('CHECKLIST_TEMPLATES', 'VIEW')
  @ApiOperation({ summary: 'Get checklist template with versions and draft payload' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.checklistTemplatesService.findById(id);
  }

  @Post()
  @RequirePermission('CHECKLIST_TEMPLATES', 'ADD')
  @ApiOperation({ summary: 'Create checklist template with initial draft version' })
  create(@CurrentUser() user: CurrentUserPayload, @Body() body: CreateChecklistTemplateDto) {
    return this.checklistTemplatesService.create(body, user.id);
  }

  @Patch(':id')
  @RequirePermission('CHECKLIST_TEMPLATES', 'EDIT')
  @ApiOperation({ summary: 'Update template metadata (name, description, category, owner module)' })
  updateMetadata(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateChecklistTemplateDto,
  ) {
    return this.checklistTemplatesService.updateMetadata(id, body, user.id);
  }

  @Put(':id/draft-items')
  @RequirePermission('CHECKLIST_TEMPLATES', 'EDIT')
  @ApiOperation({ summary: 'Replace items on the current draft version' })
  updateDraftItems(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateDraftItemsDto,
  ) {
    return this.checklistTemplatesService.updateDraftItems(id, body, user.id);
  }

  @Post(':id/publish')
  @RequirePermission('CHECKLIST_TEMPLATES', 'PUBLISH')
  @ApiOperation({ summary: 'Publish draft, set active version, open next draft' })
  publish(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.checklistTemplatesService.publish(id, user.id);
  }

  @Post(':id/archive')
  @RequirePermission('CHECKLIST_TEMPLATES', 'ARCHIVE')
  @ApiOperation({ summary: 'Archive checklist template' })
  archive(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.checklistTemplatesService.archive(id, user.id);
  }

  @Post(':id/duplicate')
  @RequirePermission('CHECKLIST_TEMPLATES', 'ADD')
  @ApiOperation({ summary: 'Duplicate template into a new draft (copy of draft or active items)' })
  duplicate(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.checklistTemplatesService.duplicateFrom(id, user.id);
  }

  @Post(':id/instances')
  @RequirePermission('CHECKLIST_TEMPLATES', 'EDIT')
  @ApiOperation({ summary: 'Create checklist instance from active published version' })
  createInstance(@Param('id', ParseUUIDPipe) id: string, @Body() body: CreateChecklistInstanceDto) {
    return this.checklistTemplatesService.createInstance(id, body);
  }
}
