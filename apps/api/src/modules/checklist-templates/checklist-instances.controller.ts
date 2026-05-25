import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequirePermission, type CurrentUserPayload } from '../../common/decorators';
import { ChecklistTemplatesService } from './checklist-templates.service';
import { ListChecklistInstancesQueryDto } from './dto/list-checklist-instances.query.dto';
import { UpdateChecklistInstanceItemDto } from './dto/update-checklist-instance-item.dto';

@ApiTags('Checklist instances')
@ApiBearerAuth()
@Controller('checklist-instances')
export class ChecklistInstancesController {
  constructor(private readonly checklistTemplatesService: ChecklistTemplatesService) {}

  @Get()
  @RequirePermission('CHECKLIST_TEMPLATES', 'VIEW')
  @ApiOperation({ summary: 'List checklist instances for an owner entity' })
  list(@Query() query: ListChecklistInstancesQueryDto) {
    return this.checklistTemplatesService.listInstances(query.ownerEntityType, query.ownerEntityId);
  }

  @Patch(':id/items')
  @RequirePermission('CHECKLIST_TEMPLATES', 'EDIT')
  @ApiOperation({ summary: 'Mark one checklist instance item as Pending, Done or Not Done' })
  updateItem(
    @Param('id') id: string,
    @Body() body: UpdateChecklistInstanceItemDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.checklistTemplatesService.updateInstanceItem(id, body, user.id);
  }

  @Post(':id/complete')
  @RequirePermission('CHECKLIST_TEMPLATES', 'EDIT')
  @ApiOperation({ summary: 'Complete checklist instance after required decisions are reviewed' })
  complete(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.checklistTemplatesService.completeInstance(id, user.id);
  }
}
