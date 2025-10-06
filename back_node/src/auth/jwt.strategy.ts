import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt } from 'passport-jwt';
import { jwtConstants } from './constants';
import JwtStrategyBase = require('passport-jwt/lib/strategy');

export interface JwtPayload {
  sub: number;
  correo: string;
  rol: string;
  cajaId?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(JwtStrategyBase, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || jwtConstants.secret,
    });
  }

  validate(payload: JwtPayload) {
    return {
      userId: payload.sub,
      correo: payload.correo,
      rol: payload.rol,
      cajaId: payload.cajaId ?? null,
    };
  }
}
