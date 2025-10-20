import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProveedorEntity } from './proveedor.entity';
import { ProveedorService } from './proveedor.service';
import { ProveedorController } from './proveedor.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProveedorEntity])],
  controllers: [ProveedorController],
  providers: [ProveedorService],
})
export class ProveedorModule {}
