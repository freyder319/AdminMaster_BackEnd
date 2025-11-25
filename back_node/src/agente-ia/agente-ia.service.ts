import { Injectable, BadGatewayException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class AgenteIaService {
  private readonly logger = new Logger(AgenteIaService.name);
  private readonly webhookUrl = process.env.N8N_CHAT_WEBHOOK ?? 'https://adminmaster.app.n8n.cloud/webhook/chat';

  constructor(private readonly httpService: HttpService) {}

  async forwardToWebhook(payload: SendMessageDto): Promise<unknown> {
    try {
      const { data } = await lastValueFrom(
        this.httpService.post(
          this.webhookUrl,
          {
            message: payload.message,
            history: payload.history ?? [],
          },
          { timeout: 15000 },
        ),
      );

      return data;
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(
        `Error enviando mensaje al webhook de n8n: ${axiosError.message}`,
        axiosError.stack,
      );
      throw new BadGatewayException('No fue posible obtener una respuesta del agente IA');
    }
  }
}
