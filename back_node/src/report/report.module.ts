import { Module } from '@nestjs/common';
import { ReportController } from './report.controller';
import { VentaModule } from '../venta/venta.module';
import { GastoModule } from '../gasto/gasto.module';
import { ProductoModule } from '../producto/producto.module';
import { CajaModule } from '../caja/caja.module';
import { ProveedorModule } from '../proveedor/proveedor.module';
import { ClienteModule } from '../cliente/cliente.module';
import { EmpleadoModule } from '../empleado/empleado.module';

@Module({
  imports: [VentaModule, GastoModule, ProductoModule, CajaModule, ProveedorModule, ClienteModule, EmpleadoModule],
  controllers: [ReportController],
})
export class ReportModule {}
