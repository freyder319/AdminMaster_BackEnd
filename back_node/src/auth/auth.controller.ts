import { Controller, Post, Body, Get, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request } from 'express';
import { Usuario } from '../users/user.entity';
import * as bcrypt from 'bcrypt';
import { UsuarioService } from 'src/users/users.service';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { SmsService } from 'src/sms/sms.service';
import { MailService } from 'src/mail/mail.service';

export interface RequestWithUser extends Request {
  user: Usuario;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usuarioService: UsuarioService,
    private readonly mailService: MailService,
    private readonly smsService: SmsService,
  ) {}

  @Post('login')
  async login(@Body() body: { correo: string; contrasena: string }) {
    const user = await this.authService.validateUser(body.correo, body.contrasena);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return this.authService.login(user);
  }

  @Post('loginpuntopos')
  async loginPuntoPos(@Body('codigoCaja') codigoCaja: string) {
    const caja = await this.authService.findCajaByCodigo(codigoCaja);
    if (!caja) throw new UnauthorizedException('Caja no encontrada');

    const usuario = caja.usuarios.find((u) => u.rol === 'punto_pos');
    if (!usuario) throw new UnauthorizedException('Sin usuario punto_pos');

    return this.authService.login(usuario, { cajaId: caja.id });
  }

  @Get('profile')
  getProfile(@Req() req: RequestWithUser) {
    return req.user;
  }

  @Post('hash-password')
  async hashPassword(@Body('contrasena') contrasena: string) {
    const hashed = await bcrypt.hash(contrasena, 10);
    return { hashed };
  }

  @Post('recuperar-correo')
  async recuperarPorCorreo(@Body() body: { correo: string }) {
    const usuario = await this.usuarioService.findByCorreo(body.correo);
    if (!usuario) throw new NotFoundException('Correo no registrado');

    const token = this.authService.generarTokenRecuperacion(usuario.id);
    await this.mailService.enviarCorreoRecuperacion(usuario.correo, token);
    return { mensaje: 'Correo enviado' };
  }

  @Post('restablecer-contrasena')
  async restablecer(@Body() body: { token: string; nueva: string }) {
    const userId = this.authService.validarTokenRecuperacion(body.token);
    await this.usuarioService.actualizarContrasena(userId, body.nueva);
    return { mensaje: 'Contraseña actualizada' };
  }

  @Post('recuperar-telefono')
  async recuperarPorTelefono(@Body() body: { telefono: string }) {
    const usuario = await this.usuarioService.findByTelefono(body.telefono);
    if (!usuario) throw new NotFoundException('Teléfono no registrado');

    const codigo = await this.authService.generarCodigoSMS(usuario.id);
    await this.smsService.enviarCodigo(usuario.telefono, codigo);
    return { mensaje: 'Código enviado por SMS' };
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
}
