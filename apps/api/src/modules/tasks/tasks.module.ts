import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TaskBoardsController } from './task-boards.controller';
import { TaskBoardsService } from './task-boards.service';
import { RecurringTasksController } from './recurring-tasks.controller';
import { RecurringTasksService } from './recurring-tasks.service';

@Module({
  controllers: [TasksController, TaskBoardsController, RecurringTasksController],
  providers: [TasksService, TaskBoardsService, RecurringTasksService],
  exports: [TasksService, TaskBoardsService, RecurringTasksService],
})
export class TasksModule {}
