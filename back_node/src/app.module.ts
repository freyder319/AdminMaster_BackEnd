import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClienteModule } from './cliente/cliente.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CajaModule } from './caja/caja.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { SmsService } from './sms/sms.service';
import { MailService } from './mail/mail.service';
import { SmsModule } from './sms/sms.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ClienteModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'Cristian2020CC',
      database: 'postgres',
      autoLoadEntities: true,
      synchronize: true,
    }),
    CajaModule,
    AuthModule,
    UsersModule,
    ConfigModule,
    SmsModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [AppService, SmsService, MailService],
})
export class AppModule {}
