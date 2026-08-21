import { Module } from '@nestjs/common';
import { NotificationModule } from '../notifications/notification.module';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TaskBoardsController } from './task-boards.controller';
import { TaskBoardsService } from './task-boards.service';
import { RecurringTasksController } from './recurring-tasks.controller';
import { RecurringTasksService } from './recurring-tasks.service';
import { WorkSpacesController } from './work-spaces.controller';
import { WorkSpacesService } from './work-spaces.service';
import { WorkSpaceSprintsController } from './work-space-sprints.controller';
import { WorkSpaceSprintsService } from './work-space-sprints.service';
import { TaskDiscussionController } from './task-discussion.controller';
import { TaskDiscussionService } from './task-discussion.service';

@Module({
  imports: [NotificationModule],
  controllers: [
    // WorkSpacesController must be registered before TasksController: otherwise
    // GET /tasks/:id on TasksController captures the literal segment "work-spaces"
    // and GET /api/tasks/work-spaces never reaches WorkSpacesController.
    WorkSpaceSprintsController,
    TaskDiscussionController,
    WorkSpacesController,
    TasksController,
    TaskBoardsController,
    RecurringTasksController,
  ],
  providers: [
    TasksService,
    TaskBoardsService,
    RecurringTasksService,
    WorkSpacesService,
    WorkSpaceSprintsService,
    TaskDiscussionService,
  ],
  exports: [
    TasksService,
    TaskBoardsService,
    RecurringTasksService,
    WorkSpacesService,
    WorkSpaceSprintsService,
    TaskDiscussionService,
  ],
})
export class TasksModule {}
