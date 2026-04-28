import { Module } from '@nestjs/common';
import { EmployeesController } from './employees.controller';
import { MeController } from './me.controller';
import { EmployeesService } from './employees.service';
import { EmployeeWalletService } from './employee-wallet.service';

@Module({
  controllers: [EmployeesController, MeController],
  providers: [EmployeesService, EmployeeWalletService],
  exports: [EmployeesService, EmployeeWalletService],
})
export class EmployeesModule {}
