import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';
import { jwtConstants } from './constants';
import { CajaModule } from 'src/caja/caja.module';
import { SmsModule } from 'src/sms/sms.module';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [
    SmsModule,
    MailModule,
    CajaModule,
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
