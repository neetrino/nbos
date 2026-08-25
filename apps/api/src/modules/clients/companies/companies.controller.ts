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
import {
  CurrentUser,
  RequirePermission,
  type CurrentUserPayload,
} from '../../../common/decorators';
import { CompaniesService } from './companies.service';
import { ArmeniaCompanyLookupService } from './armenia-lookup/armenia-company-lookup.service';
import { LookupCompanyQueryDto } from './dto/lookup-company-query.dto';

@ApiTags('Clients / Companies')
@ApiBearerAuth()
@Controller('clients/companies')
export class CompaniesController {
  constructor(
    private readonly companiesService: CompaniesService,
    private readonly armeniaCompanyLookup: ArmeniaCompanyLookupService,
  ) {}

  @Get()
  @RequirePermission('CLIENTS', 'VIEW')
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

  @Get('lookup')
  @RequirePermission('CLIENTS', 'VIEW')
  @ApiOperation({ summary: 'Look up Armenian company requisites by TIN or name' })
  @ApiQuery({ name: 'q', required: true })
  async lookup(@Query() query: LookupCompanyQueryDto) {
    return this.armeniaCompanyLookup.search(query.q);
  }

  @Get(':id')
  @RequirePermission('CLIENTS', 'VIEW')
  @ApiOperation({ summary: 'Get company by ID' })
  async findOne(@Param('id') id: string) {
    return this.companiesService.findById(id);
  }

  @Post()
  @RequirePermission('CLIENTS', 'ADD')
  @ApiOperation({ summary: 'Create company' })
  async create(
    @Body()
    body: {
      name: string;
      contactId?: string | null;
      contactIds?: string[];
      billingContactId?: string | null;
      type?: string;
      taxId?: string;
      legalName?: string | null;
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
  @RequirePermission('CLIENTS', 'EDIT')
  @ApiOperation({ summary: 'Update company' })
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      contactId?: string | null;
      contactIds?: string[];
      billingContactId?: string | null;
      type?: string;
      taxId?: string;
      legalName?: string | null;
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
  @RequirePermission('CLIENTS', 'EDIT')
  @ApiOperation({ summary: 'Restore company from Trash' })
  async restore(@Param('id') id: string) {
    return this.companiesService.restoreFromTrash(id);
  }

  @Delete(':id/permanent')
  @RequirePermission('CLIENTS', 'DELETE')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Permanently delete trashed company (cannot be undone)' })
  async permanentRemove(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    await this.companiesService.permanentlyDeleteFromTrash(id, user.id);
  }

  @Delete(':id')
  @RequirePermission('CLIENTS', 'DELETE')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Move company to Trash' })
  async remove(@Param('id') id: string) {
    await this.companiesService.moveToTrash(id);
  }
}
