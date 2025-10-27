import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';
import { jwtConstants } from './constants';
import { CajaModule } from 'src/caja/caja.module';
import { MailModule } from 'src/mail/mail.module';
import { EmpleadoModule } from 'src/empleado/empleado.module';

@Module({
  imports: [
    EmpleadoModule,
    MailModule,
    CajaModule,
    UsersModule,
    PassportModule,
    JwtModule.register({
      // Forzar uso de un único secreto durante diagnóstico para evitar firmas distintas
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
