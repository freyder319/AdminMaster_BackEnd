import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClienteModule } from './cliente/cliente.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [ClienteModule,TypeOrmModule.forRoot({
    type: 'postgres',
    host: 'localhost',
    port: 5434,
    username: 'postgres',
    password: '514022',
    database:'postgres',
    autoLoadEntities: true,
    synchronize: true
  })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
