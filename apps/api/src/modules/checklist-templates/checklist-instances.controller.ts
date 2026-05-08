import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators';
import { ChecklistTemplatesService } from './checklist-templates.service';
import { ListChecklistInstancesQueryDto } from './dto/list-checklist-instances.query.dto';

@ApiTags('Checklist instances')
@ApiBearerAuth()
@Controller('checklist-instances')
export class ChecklistInstancesController {
  constructor(private readonly checklistTemplatesService: ChecklistTemplatesService) {}

  @Get()
  @RequirePermission('COMPANY', 'VIEW')
  @ApiOperation({ summary: 'List checklist instances for an owner entity' })
  list(@Query() query: ListChecklistInstancesQueryDto) {
    return this.checklistTemplatesService.listInstances(query.ownerEntityType, query.ownerEntityId);
  }
}
