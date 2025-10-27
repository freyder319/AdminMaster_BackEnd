import { Controller, Post, Body, Get, Req, Param, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Request } from 'express';
import { Usuario } from '../users/user.entity';
import * as bcrypt from 'bcrypt';
import { UsuarioService } from 'src/users/users.service';
import { UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { MailService } from 'src/mail/mail.service';
import { EmpleadoService } from 'src/empleado/empleado.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';

export interface RequestWithUser extends Request {
  user: Usuario;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usuarioService: UsuarioService,
    private readonly mailService: MailService,
    private readonly empleadoService: EmpleadoService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('login')
  async login(@Body() body: { correo: string; contrasena: string }) {
    const user = await this.authService.validateUser(body.correo, body.contrasena);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    let cajaId: number | undefined;
    if (user.rol === 'punto_pos') {
      const caja = await this.authService.findCajaByUsuarioId(user.id, user.origen === 'empleado');
      if (!caja) {
        throw new UnauthorizedException('Caja no asignada al usuario punto_pos');
      }
      cajaId = caja.id;
    }

    const { caja, ...userSinCaja } = user;
    return this.authService.login(userSinCaja, cajaId ? { cajaId } : undefined);
  }

  @Get('profile')
  getProfile(@Req() req: RequestWithUser) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: any) {
    return req.user;
  }

  // Endpoint temporal para depurar problemas de JWT
  @Post('token-health')
  async tokenHealth(@Req() req: any) {
    const auth = String(req.headers?.authorization || '');
    const bearer = auth.startsWith('Bearer ')
      ? auth.substring(7)
      : undefined;
    if (!bearer) {
      return { valid: false, reason: 'No Authorization Bearer token', received: auth };
    }
    try {
      const decoded: any = this.jwtService.decode(bearer);
      const verified: any = this.jwtService.verify(bearer);
      const nowSec = Math.floor(Date.now() / 1000);
      const exp = Number(verified?.exp ?? decoded?.exp ?? 0);
      const iat = Number(verified?.iat ?? decoded?.iat ?? 0);
      const secondsToExp = exp ? exp - nowSec : null;
      return {
        valid: true,
        payload: verified,
        iat,
        exp,
        now: nowSec,
        secondsToExp,
      };
    } catch (e: any) {
      return {
        valid: false,
        reason: e?.message || String(e),
      };
    }
  }

  @Post('hash-password')
  async hashPassword(@Body('contrasena') contrasena: string) {
    const hashed = await bcrypt.hash(contrasena, 10);
    return { hashed };
  }

  // Telefono
  @Post('restablecer-con-token')
  async restablecerConToken(@Body() body: { token: string; nueva: string }) {
    const userId = this.authService.validarTokenRecuperacion(body.token);
    await this.usuarioService.actualizarContrasena(userId, body.nueva);
    return { mensaje: 'Contraseña actualizada' };
  }

  @Post('validar-codigo-sms')
  async validarSMS(@Body() body: { telefono: string; codigo: string; nueva: string }) {
    const valido = this.authService.validarCodigoSMS(body.telefono, body.codigo);
    if (!valido) throw new UnauthorizedException('Código inválido');

    const usuario = await this.usuarioService.findByTelefono(body.telefono);
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    await this.usuarioService.actualizarContrasena(usuario.id, body.nueva);
    return { mensaje: 'Contraseña actualizada' };
  }

  // Correo
  @Post('verificar-correo')
  verificarCodigo(@Body() body: { correo: string; codigo: string }) {
    const res = this.authService.verificarCodigoCorreoDetalle(body.correo, body.codigo);
    if (!res.ok) {
      if (res.reason === 'expired') throw new BadRequestException('Código expirado');
      throw new BadRequestException('Código incorrecto');
    }
    return { mensaje: 'Código verificado correctamente' };
  }

  @Post('restablecer-con-correo')
  async restablecerConCorreo(@Body() body: { correo: string; nueva: string }) {
    const usuario = await this.usuarioService.findByUsername(body.correo);
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    console.log('Contraseña recibida para restablecer:', body.nueva);
    await this.usuarioService.actualizarContrasena(usuario.id, body.nueva);
    return { mensaje: 'Contraseña actualizada correctamente' };
  }

  @Post('recuperar-correo')
  async recuperarPorCorreo(@Body() body: { correo: string }) {
    if (!body || typeof body.correo !== 'string') {
      throw new BadRequestException('Usuario sin correo');
    }

    const correo = body.correo.trim().toLowerCase();
    console.log('Correo recibido:', correo);

    const usuario = await this.usuarioService.findByCorreo(correo);
    const empleado = await this.empleadoService.findByCorreo(correo);

    console.log('Usuario:', usuario);
    console.log('Empleado:', empleado);

    if (!usuario && !empleado) {
      throw new NotFoundException('Correo no registrado');
    }

    const id = usuario?.id || empleado!.id;
    const tipo = usuario ? 'usuario' : 'empleado';
    const token = await this.authService.generarTokenRecuperacion(id, tipo);

    await this.mailService.enviarCorreoRecuperacion(correo, token);

    return { mensaje: 'Se ha enviado un código de verificación al correo' };
  }

  @Get('correo-envio')
  getCorreoEnvio(): string {
    return process.env.MAIL_USER || '';
  }

  @Get('verificar/:correo')
  async verificarCorreo(@Param('correo') correo: string): Promise<boolean> {
    const usuario = await this.usuarioService.findByCorreo(correo);
    return !!usuario;
  }

  @Post('enviar-recuperacion')
  async enviarCorreoRecuperacion(@Body('correo') correo: string) {
    const normalizado = correo.trim().toLowerCase();

    const usuario = await this.usuarioService.findByCorreo(normalizado);
    const empleado = await this.empleadoService.findByCorreo(normalizado);

    if (!usuario && !empleado) {
      throw new NotFoundException('Correo no registrado');
    }

    const id = usuario?.id || empleado!.id;
    const tipo = usuario ? 'usuario' : 'empleado';
    const token = await this.authService.generarTokenRecuperacion(id, tipo);
    await this.mailService.enviarCorreoRecuperacion(normalizado, token);

    return { mensaje: 'Se ha enviado un código de verificación al correo' };
  }

  @Get('debug-empleado/:correo')
  async debugEmpleado(@Param('correo') correo: string) {
    const empleado = await this.empleadoService.findByCorreo(correo);
    console.log('Empleado encontrado:', empleado);
    return empleado || { mensaje: 'No encontrado' };
  }
}
