import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { TaskBoardsService } from './task-boards.service';

@ApiTags('Task Boards')
@ApiBearerAuth()
@Controller('task-boards')
export class TaskBoardsController {
  constructor(private readonly boardsService: TaskBoardsService) {}

  @Get('kanban/stages')
  @Public()
  @ApiOperation({ summary: 'Get shared KANBAN board stages' })
  async getKanbanStages() {
    return this.boardsService.getKanbanStages();
  }

  @Get('my-plan/stages')
  @Public()
  @ApiOperation({ summary: 'Get personal MY_PLAN stages' })
  async getMyPlanStages(@Query('ownerId') ownerId: string) {
    return this.boardsService.getMyPlanStages(ownerId);
  }

  @Post('stages')
  @Public()
  @ApiOperation({ summary: 'Create a board stage' })
  async createStage(
    @Body()
    body: {
      boardType: 'KANBAN' | 'MY_PLAN';
      title: string;
      color?: string;
      ownerId?: string;
    },
  ) {
    return this.boardsService.createStage(body);
  }

  @Patch('stages/:id')
  @Public()
  @ApiOperation({ summary: 'Update a board stage' })
  async updateStage(
    @Param('id') id: string,
    @Body() body: { title?: string; color?: string; sortOrder?: number },
  ) {
    return this.boardsService.updateStage(id, body);
  }

  @Delete('stages/:id')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a board stage' })
  async deleteStage(@Param('id') id: string) {
    await this.boardsService.deleteStage(id);
  }

  @Patch('stages/reorder')
  @Public()
  @ApiOperation({ summary: 'Reorder board stages' })
  async reorderStages(@Body() body: { stageIds: string[] }) {
    return this.boardsService.reorderStages(body.stageIds);
  }
}
