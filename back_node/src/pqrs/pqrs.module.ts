import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PqrsEntity } from './pqrs.entity';
import { PqrsService } from './pqrs.service';
import { PqrsController } from './pqrs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PqrsEntity])],
  providers: [PqrsService],
  controllers: [PqrsController],
})
export class PqrsModule {}
