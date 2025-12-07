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
    const secret = jwtConstants.secret; // Forzar mismo secreto que JwtModule durante diagnóstico
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
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
