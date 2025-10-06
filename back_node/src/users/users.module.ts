import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuarioService } from './users.service';
import { Usuario } from './user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario])],
  providers: [UsuarioService],
  exports: [UsuarioService],
})
export class UsersModule {}
