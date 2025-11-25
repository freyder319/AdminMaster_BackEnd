import { Controller, Post, Body, Get, Req, Param, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Request } from 'express';
import { Usuario } from '../users/user.entity';
import { UsuarioService } from 'src/users/users.service';
import { UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { MailService } from 'src/mail/mail.service';
import { EmpleadoService } from 'src/empleado/empleado.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuditService } from 'src/audit/audit.service';

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
    private readonly audit: AuditService,
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
    const res = this.authService.login(userSinCaja, cajaId ? { cajaId } : undefined);
    try {
      await this.audit.log({
        module: 'auth',
        action: 'login',
        actorUserId: user.id,
        actorRol: user.rol,
        entity: 'Usuario',
        entityId: String(user.id),
        details: { correo: user.correo, cajaId: cajaId ?? null },
      });
    } catch {}
    return res;
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
    await this.usuarioService.actualizarContrasena(usuario.id, body.nueva);
    return { mensaje: 'Contraseña actualizada correctamente' };
  }

  @Post('empleado/activar')
  async activarEmpleado(@Body() body: { correo: string; codigo: string; nueva: string }) {
    const correo = (body.correo || '').trim().toLowerCase();
    const codigo = (body.codigo || '').toString().trim().toUpperCase();
    const nueva = body.nueva;

    if (!correo || !codigo || !nueva) {
      throw new BadRequestException('Datos incompletos para activación');
    }

    const verificacion = this.authService.verificarCodigoCorreoDetalle(correo, codigo);
    if (!verificacion.ok) {
      if (verificacion.reason === 'expired') throw new BadRequestException('El enlace o código de activación ha expirado');
      throw new BadRequestException('Código de activación inválido');
    }

    const empleado = await this.empleadoService.findByCorreo(correo);
    if (!empleado) {
      throw new NotFoundException('Empleado no encontrado para este correo');
    }

    await this.empleadoService.actualizarContrasena(empleado.id, nueva);
    return { mensaje: 'Cuenta de empleado activada correctamente' };
  }

  @Post('recuperar-correo')
  async recuperarPorCorreo(@Body() body: { correo: string }) {
    if (!body || typeof body.correo !== 'string') {
      throw new BadRequestException('Usuario sin correo');
    }

    const correo = body.correo.trim().toLowerCase();

    const usuario = await this.usuarioService.findByCorreo(correo);
    const empleado = await this.empleadoService.findByCorreo(correo);

    if (!usuario && !empleado) {
      throw new NotFoundException('Correo no registrado');
    }

    const id = usuario?.id || empleado!.id;
    const tipo = usuario ? 'usuario' : 'empleado';
    const token = await this.authService.generarTokenRecuperacion(id, tipo);

    await this.mailService.enviarCorreoRecuperacion(correo, token);

    return { mensaje: 'Se ha enviado un código de verificación al correo' };
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

  @Post('enviar-activacion-empleado')
  async enviarCorreoActivacionEmpleado(@Body('correo') correo: string) {
    const normalizado = correo.trim().toLowerCase();

    const empleado = await this.empleadoService.findByCorreo(normalizado);
    if (!empleado) {
      throw new NotFoundException('Correo de empleado no registrado');
    }

    const token = await this.authService.generarTokenRecuperacion(empleado.id, 'empleado');
    await this.mailService.enviarCorreoActivacionEmpleado(normalizado, token);

    return { mensaje: 'Se ha enviado un código de activación al correo del empleado' };
  }
}
