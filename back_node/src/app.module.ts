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
import { DescuentoModule } from './descuento/descuento.module';
import { PqrsModule } from './pqrs/pqrs.module';
import { AuditModule } from './audit/audit.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from './audit/audit.interceptor';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { RolesGuard } from './auth/roles.guard';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ClienteModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60_000,
          limit: 60,
        },
        {
          name: 'auth-low',
          ttl: 60_000,
          limit: 5,
        },
      ],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        host: String(cfg.get('DB_HOST') ?? 'localhost'),
        port: Number(cfg.get('DB_PORT') ?? '5432'),
        username: String(cfg.get('DB_USER') ?? 'postgres'),
        password: String(cfg.get('DB_PASSWORD') ?? 'Cristian2020CC'),
        database: String(cfg.get('DB_NAME') ?? 'postgres'),
        autoLoadEntities: true,
        synchronize: String(cfg.get('DB_SYNC') ?? 'true') === 'true',
      }),
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
    DescuentoModule,
    PqrsModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    MailService,
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
