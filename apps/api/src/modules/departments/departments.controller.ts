import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { RequirePermission } from '../../common/decorators';

@ApiTags('Departments')
@ApiBearerAuth()
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all departments' })
  findAll() {
    return this.departmentsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get department by ID with members' })
  findById(@Param('id') id: string) {
    return this.departmentsService.findById(id);
  }

  @Post()
  @RequirePermission('COMPANY', 'ADD')
  @ApiOperation({ summary: 'Create department' })
  create(
    @Body()
    body: {
      name: string;
      slug: string;
      description?: string;
      parentId?: string;
      sortOrder?: number;
    },
  ) {
    return this.departmentsService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update department' })
  update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      slug?: string;
      description?: string;
      parentId?: string;
      sortOrder?: number;
    },
  ) {
    return this.departmentsService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete department' })
  remove(@Param('id') id: string) {
    return this.departmentsService.remove(id);
  }
}
