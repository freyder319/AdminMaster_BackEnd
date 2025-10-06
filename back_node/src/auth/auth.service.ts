import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuarioService } from '../users/users.service';
import { Usuario } from '../users/user.entity';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './jwt.strategy';
import { CajaService } from 'src/caja/caja.service';
import { randomBytes } from 'crypto';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';

@Injectable()
export class AuthService {
  private tokensRecuperacion = new Map<string, number>();
  private codigosSMS = new Map<string, string>();

  constructor(
    private readonly usuarioService: UsuarioService,
    private readonly jwtService: JwtService,
    private readonly cajaService: CajaService,
  ) {}

  async findCajaByCodigo(codigoCaja: string) {
    return this.cajaService.findByCodigoWithUsuarios(codigoCaja);
  }

  async validateUser(
    correo: string,
    contrasena: string,
  ): Promise<Omit<Usuario, 'contrasena'> | null> {
    try {
      const user = await this.usuarioService.findByUsername(correo);
      if (!user || typeof user.contrasena !== 'string') return null;

      const isMatch = await bcrypt.compare(contrasena, user.contrasena);
      if (!isMatch) return null;

      const { contrasena: _, ...result } = user;
      return result;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error al validar usuario:', error.message);
      } else {
        console.error('Error desconocido al validar usuario:', error);
      }
      return null;
    }
  }

  login(user: Omit<Usuario, 'contrasena'>, extra?: { cajaId?: number }) {
    const payload: JwtPayload = {
      sub: user.id,
      correo: user.correo,
      rol: user.rol,
      cajaId: extra?.cajaId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      rol: user.rol,
      cajaId: extra?.cajaId,
    };
  }

  generarTokenRecuperacion(userId: number): string {
    const token = randomBytes(32).toString('hex');
    this.tokensRecuperacion.set(token, userId);
    return token;
  }

  validarTokenRecuperacion(token: string): number {
    const userId = this.tokensRecuperacion.get(token);
    if (!userId) throw new UnauthorizedException('Token inválido');
    this.tokensRecuperacion.delete(token);
    return userId;
  }

  async generarCodigoSMS(userId: number): Promise<string> {
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const usuario = await this.usuarioService.findById(userId);
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    this.codigosSMS.set(usuario.telefono, codigo);
    return codigo;
  }

  validarCodigoSMS(telefono: string, codigo: string): boolean {
    const esperado = this.codigosSMS.get(telefono);
    if (esperado !== codigo) return false;
    this.codigosSMS.delete(telefono);
    return true;
  }
}
