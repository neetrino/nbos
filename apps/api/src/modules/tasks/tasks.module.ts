import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TaskBoardsController } from './task-boards.controller';
import { TaskBoardsService } from './task-boards.service';
import { RecurringTasksController } from './recurring-tasks.controller';
import { RecurringTasksService } from './recurring-tasks.service';
import { WorkSpacesController } from './work-spaces.controller';
import { WorkSpacesService } from './work-spaces.service';

@Module({
  controllers: [
    TasksController,
    TaskBoardsController,
    RecurringTasksController,
    WorkSpacesController,
  ],
  providers: [TasksService, TaskBoardsService, RecurringTasksService, WorkSpacesService],
  exports: [TasksService, TaskBoardsService, RecurringTasksService, WorkSpacesService],
})
export class TasksModule {}
