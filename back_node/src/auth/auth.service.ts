import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuarioService } from '../users/users.service';
import { Usuario } from '../users/user.entity';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './jwt.strategy';
import { CajaService } from 'src/caja/caja.service';
import { UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { EmpleadoService } from 'src/empleado/empleado.service';
import { CajaEntity } from 'src/caja/caja.entity';
import { Rol } from 'src/users/role.enum';

@Injectable()
export class AuthService {
  private tokensRecuperacion = new Map<string, number>();
  private codigosSMS = new Map<string, string>();
  private codigosCorreo = new Map<string, string>();

  constructor(
    private readonly usuarioService: UsuarioService,
    private readonly jwtService: JwtService,
    private readonly cajaService: CajaService,
    private readonly empleadoService: EmpleadoService,
  ) {}

  async findCajaByUsuarioId(id: number, esEmpleado: boolean) {
    return this.cajaService.findCajaByUsuarioId(id, esEmpleado);
  }

  async validateUser(
    correo: string,
    contrasena: string,
  ): Promise<{
    id: number;
    correo: string;
    rol: Rol;
    origen: 'usuario' | 'empleado';
    caja?: CajaEntity;
  } | null> {
    try {
      const user = await this.usuarioService.findByUsername(correo);
      const empleado = !user ? await this.empleadoService.findByUsername(correo) : null;

      const entidad = user ?? empleado;
      const rol = user ? user.rol : Rol.VentaPOS;

      // console.log('Entidad encontrada:', entidad);

      if (!entidad || typeof entidad.contrasena !== 'string') {
        console.warn('Entidad no encontrada o contraseña inválida');
        return null;
      }

      // console.log('Contraseña ingresada:', contrasena);
      // console.log('Hash en base de datos:', entidad.contrasena);

      const isMatch = await bcrypt.compare(contrasena, entidad.contrasena);
      console.log('¿Contraseña válida?', isMatch);

      if (!isMatch) {
        console.warn('La contraseña no coincide');
        return null;
      }

      const { contrasena: _, ...rest } = entidad;
      return { ...rest, rol, origen: user ? 'usuario' : 'empleado' };
    } catch (error: unknown) {
      console.error('Error al validar entidad:', error instanceof Error ? error.message : error);
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
      userId: user.id,
      cajaId: extra?.cajaId,
    };
  }

  // Logica de Recuperación Correo
  async generarTokenRecuperacion(id: number, tipo: 'usuario' | 'empleado'): Promise<string> {
    const token = Math.random().toString(36).substring(2, 8).toUpperCase();

    let correo: string | undefined;

    if (tipo === 'usuario') {
      const usuario = await this.usuarioService.findById(id);
      if (!usuario || !usuario.correo) throw new BadRequestException('Usuario sin correo');
      correo = usuario.correo;
    } else {
      const empleado = await this.empleadoService.findById(id);
      if (!empleado || !empleado.correo) throw new BadRequestException('Empleado sin correo');
      correo = empleado.correo;
    }

    this.codigosCorreo.set(correo, token);
    return token;
  }

  verificarCodigoCorreo(correo: string, codigo: string): boolean {
    const esperado = this.codigosCorreo.get(correo);
    if (!esperado || esperado !== codigo) return false;
    this.codigosCorreo.delete(correo);
    return true;
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
    if (!usuario.telefono) {
      throw new BadRequestException('El Usuario no tiene teléfono registrado');
    }
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
