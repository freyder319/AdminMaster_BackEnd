import { Body, Controller, Post } from '@nestjs/common';
import { AgenteIaService } from './agente-ia.service';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('agente-ia')
export class AgenteIaController {
  constructor(private readonly agenteIaService: AgenteIaService) {}

  @Post('chat')
  chat(@Body() payload: SendMessageDto) {
    return this.agenteIaService.forwardToWebhook(payload);
  }
}
