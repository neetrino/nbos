import { Module } from '@nestjs/common';
import { AutoTasksController } from './auto-tasks.controller';
import { AutoTasksService } from './auto-tasks.service';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [TasksModule],
  controllers: [AutoTasksController],
  providers: [AutoTasksService],
  exports: [AutoTasksService],
})
export class AutomationModule {}
