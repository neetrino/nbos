import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type CurrentUserPayload, RequirePermission } from '../../common/decorators';
import { ChecklistTemplatesService } from './checklist-templates.service';
import { CreateChecklistInstanceDto } from './dto/create-checklist-instance.dto';
import { CreateChecklistTemplateDto } from './dto/create-checklist-template.dto';
import { UpdateChecklistTemplateDto } from './dto/update-checklist-template.dto';
import { UpdateDraftItemsDto } from './dto/update-draft-items.dto';

@ApiTags('Checklist templates')
@ApiBearerAuth()
@Controller('checklist-templates')
export class ChecklistTemplatesController {
  constructor(private readonly checklistTemplatesService: ChecklistTemplatesService) {}

  @Get()
  @RequirePermission('COMPANY', 'VIEW')
  @ApiOperation({ summary: 'List checklist templates' })
  findAll() {
    return this.checklistTemplatesService.findAll();
  }

  @Get(':id')
  @RequirePermission('COMPANY', 'VIEW')
  @ApiOperation({ summary: 'Get checklist template with versions and draft payload' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.checklistTemplatesService.findById(id);
  }

  @Post()
  @RequirePermission('COMPANY', 'EDIT')
  @ApiOperation({ summary: 'Create checklist template with initial draft version' })
  create(@CurrentUser() user: CurrentUserPayload, @Body() body: CreateChecklistTemplateDto) {
    return this.checklistTemplatesService.create(body, user.id);
  }

  @Patch(':id')
  @RequirePermission('COMPANY', 'EDIT')
  @ApiOperation({ summary: 'Update template metadata or archive' })
  updateMetadata(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateChecklistTemplateDto) {
    return this.checklistTemplatesService.updateMetadata(id, body);
  }

  @Put(':id/draft-items')
  @RequirePermission('COMPANY', 'EDIT')
  @ApiOperation({ summary: 'Replace items on the current draft version' })
  updateDraftItems(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateDraftItemsDto) {
    return this.checklistTemplatesService.updateDraftItems(id, body);
  }

  @Post(':id/publish')
  @RequirePermission('COMPANY', 'EDIT')
  @ApiOperation({ summary: 'Publish draft, set active version, open next draft' })
  publish(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.checklistTemplatesService.publish(id, user.id);
  }

  @Post(':id/instances')
  @RequirePermission('COMPANY', 'EDIT')
  @ApiOperation({ summary: 'Create checklist instance from active published version' })
  createInstance(@Param('id', ParseUUIDPipe) id: string, @Body() body: CreateChecklistInstanceDto) {
    return this.checklistTemplatesService.createInstance(id, body);
  }
}
