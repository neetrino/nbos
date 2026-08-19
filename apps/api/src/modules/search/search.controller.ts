import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type CurrentUserPayload } from '../../common/decorators';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchService } from './search.service';
import type { SearchQueryGroup } from './search.types';

@ApiTags('Search')
@ApiBearerAuth()
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({
    summary: 'Global permission-safe search across CRM, products, finance, and credentials',
  })
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({
    name: 'group',
    required: false,
    enum: ['all', 'leads', 'deals', 'products', 'finance', 'credentials'],
  })
  search(@CurrentUser() user: CurrentUserPayload, @Query() query: SearchQueryDto) {
    return this.searchService.search(user, query.q, (query.group ?? 'all') as SearchQueryGroup);
  }
}
