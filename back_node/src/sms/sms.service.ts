import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  async enviarCodigo(telefono: string, codigo: string): Promise<void> {
    // Simulación de envío SMS
    this.logger.log(`Enviando código ${codigo} al número ${telefono}`);

    // Si luego quieres usar Twilio:
    // const client = require('twilio')(TWILIO_SID, TWILIO_TOKEN);
    // await client.messages.create({
    //   body: `Tu código de verificación es: ${codigo}`,
    //   from: process.env.TWILIO_PHONE,
    //   to: telefono,
    // });
  }
}
