import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClienteModule } from './cliente/cliente.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CajaModule } from './caja/caja.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { MailService } from './mail/mail.service';
import { MailModule } from './mail/mail.module';
import { ProductoModule } from './producto/producto.module';
import { CategoriaModule } from './categoria/categoria.module';
import { EmpleadoModule } from './empleado/empleado.module';
import { ProveedorModule } from './proveedor/proveedor.module';
import { TurnoModule } from './turno/turno.module';
import { ConfiguracionModule } from './configuracion/configuracion.module';
import { GastoModule } from './gasto/gasto.module';
import { VentaLibreModule } from './venta-libre/venta-libre.module';
import { VentaModule } from './venta/venta.module';
import { ReportModule } from './report/report.module';
import { EstadisticasModule } from './estadisticas/estadisticas.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ClienteModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5434,
      username: 'postgres',
      password: '514022',
      database: 'postgres',
      autoLoadEntities: true,
      synchronize: true,
    }),
    CajaModule,
    AuthModule,
    UsersModule,
    ConfigModule,
    MailModule,
    ProductoModule,
    CategoriaModule,
    EmpleadoModule,
    ProveedorModule,
    TurnoModule,
    ConfiguracionModule,
    GastoModule,
    VentaLibreModule,
    VentaModule,
    ReportModule,
    EstadisticasModule,
  ],
  controllers: [AppController],
  providers: [AppService, MailService],
})
export class AppModule {}
