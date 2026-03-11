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
import { Public } from '../../../common/decorators';
import { CompaniesService } from './companies.service';

@ApiTags('Clients / Companies')
@ApiBearerAuth()
@Controller('clients/companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all companies' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
  ) {
    return this.companiesService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      search,
    });
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get company by ID' })
  async findOne(@Param('id') id: string) {
    return this.companiesService.findById(id);
  }

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create company' })
  async create(
    @Body()
    body: {
      name: string;
      contactId: string;
      type?: string;
      taxId?: string;
      legalAddress?: string;
      taxStatus?: string;
      notes?: string;
    },
  ) {
    return this.companiesService.create(body);
  }

  @Put(':id')
  @Public()
  @ApiOperation({ summary: 'Update company' })
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      contactId?: string;
      type?: string;
      taxId?: string;
      legalAddress?: string;
      taxStatus?: string;
      notes?: string;
    },
  ) {
    return this.companiesService.update(id, body);
  }

  @Delete(':id')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete company' })
  async remove(@Param('id') id: string) {
    await this.companiesService.delete(id);
  }
}
