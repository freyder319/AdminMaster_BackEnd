import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  private readonly transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  constructor() {
    if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
      throw new Error('Credenciales de correo no configuradas');
    }
  }

  async enviarCorreoRecuperacion(correo: string, token: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"AdminMaster" <${process.env.MAIL_USER}>`,
        to: correo,
        subject: 'Código de recuperación de contraseña',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #2c3e50;">Recuperación de contraseña</h2>
            <p>Hola, ${correo}</p>
            <p>Tu código de verificación es:</p>
            <p style="font-size: 24px; font-weight: bold; color: #2980b9;">${token}</p>
            <p>Ingresa este código en la aplicación para continuar con el restablecimiento de tu contraseña.</p>
            <p style="color:#c0392b; font-weight: 600;">Importante: este código expira en 5 minutos.</p>
            <br>
            <p style="font-size: 12px; color: #7f8c8d;">Si no solicitaste este código, puedes ignorar este mensaje.</p>
          </div>
        `,
      });

      this.logger.log(`Correo de recuperación enviado a ${correo}`);
    } catch (error: unknown) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Error al enviar correo a ${correo}: ${mensaje}`);
      throw new Error('No se pudo enviar el correo de recuperación');
    }
  }

  async enviarCorreoActivacionEmpleado(correo: string, token: string): Promise<void> {
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'https://antojitosdoima.site';
      const enlace = `${frontendUrl}/activar-empleado?correo=${encodeURIComponent(correo)}&codigo=${encodeURIComponent(token)}`;

      await this.transporter.sendMail({
        from: `"AdminMaster" <${process.env.MAIL_USER}>`,
        to: correo,
        subject: 'Activación de cuenta de empleado',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #2c3e50;">Bienvenido a AdminMaster</h2>
            <p>Hola, ${correo}</p>
            <p>Para activar tu cuenta y crear tu contraseña, haz clic en el siguiente enlace:</p>
            <p style="margin: 16px 0;">
              <a href="${enlace}" style="background:#2980b9;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">Activar mi Cuenta</a>
            </p>
            <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
            <p style="font-size: 12px; word-break: break-all;">${enlace}</p>
            <p style="color:#c0392b; font-weight: 600;">Este enlace expira en 5 minutos.</p>
            <br>
            <p style="font-size: 12px; color: #7f8c8d;">Si no esperabas este correo, puedes ignorarlo.</p>
          </div>
        `,
      });

      this.logger.log(`Correo de activación de empleado enviado a ${correo}`);
    } catch (error: unknown) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Error al enviar correo de activación a ${correo}: ${mensaje}`);
      throw new Error('No se pudo enviar el correo de activación');
    }
  }
}
