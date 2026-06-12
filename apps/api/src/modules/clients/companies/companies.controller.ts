import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CurrentUser, type CurrentUserPayload } from '../../../common/decorators';
import { CompaniesService } from './companies.service';

@ApiTags('Clients / Companies')
@ApiBearerAuth()
@Controller('clients/companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all companies' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'taxStatus', required: false })
  @ApiQuery({ name: 'scope', required: false, enum: ['active', 'trash'] })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('taxStatus') taxStatus?: string,
    @Query('scope') scope?: string,
  ) {
    return this.companiesService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      search,
      taxStatus,
      type,
      scope,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get company by ID' })
  async findOne(@Param('id') id: string) {
    return this.companiesService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create company' })
  async create(
    @Body()
    body: {
      name: string;
      contactId: string;
      billingContactId?: string | null;
      type?: string;
      taxId?: string;
      legalAddress?: string;
      taxStatus?: string;
      notes?: string;
      phone?: string | null;
      email?: string | null;
      country?: string | null;
      bankDetails?: Record<string, unknown>;
    },
  ) {
    return this.companiesService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update company' })
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      contactId?: string;
      billingContactId?: string | null;
      type?: string;
      taxId?: string;
      legalAddress?: string;
      taxStatus?: string;
      notes?: string;
      phone?: string | null;
      email?: string | null;
      country?: string | null;
      bankDetails?: Record<string, unknown> | null;
    },
  ) {
    return this.companiesService.update(id, body);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore company from Trash' })
  async restore(@Param('id') id: string) {
    return this.companiesService.restoreFromTrash(id);
  }

  @Delete(':id/permanent')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Permanently delete trashed company (cannot be undone)' })
  async permanentRemove(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    await this.companiesService.permanentlyDeleteFromTrash(id, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Move company to Trash' })
  async remove(@Param('id') id: string) {
    await this.companiesService.moveToTrash(id);
  }
}
