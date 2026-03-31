import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProductsModule } from './products/products.module';
import { ExtensionsModule } from './extensions/extensions.module';

@Module({
  imports: [ProductsModule, ExtensionsModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
