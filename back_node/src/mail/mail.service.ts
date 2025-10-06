import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  private transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  async enviarCorreoRecuperacion(correo: string, token: string): Promise<void> {
    const url = `https://tuapp.com/restablecer?token=${token}`;

    await this.transporter.sendMail({
      from: `"Soporte" <${process.env.MAIL_USER}>`,
      to: correo,
      subject: 'Recuperación de contraseña',
      html: `
        <h2>Recuperación de contraseña</h2>
        <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
        <a href="${url}">${url}</a>
        <p>Este enlace expirará en 15 minutos.</p>
      `,
    });

    this.logger.log(`Correo enviado a ${correo}`);
  }
}
