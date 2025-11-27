import { Body, Controller, Get, Post, Param, Res, HttpStatus } from '@nestjs/common';
import { type Response } from 'express';
import { AgenteIaService } from './agente-ia.service';
import { SendMessageDto } from './dto/send-message.dto';
import { AnalyzeImageDto } from './dto/analyze-image.dto';
import { TempImageDto } from './dto/temp-image.dto';

@Controller('agente-ia')
export class AgenteIaController {
  constructor(private readonly agenteIaService: AgenteIaService) {}

  @Post('chat')
  chat(@Body() payload: SendMessageDto) {
    return this.agenteIaService.forwardToWebhook(payload);
  }

  @Post('analyze-image')
  analyzeImage(@Body() payload: AnalyzeImageDto) {
    return this.agenteIaService.analyzeImage(payload);
  }

  @Post('temp-image')
  storeTempImage(@Body() payload: TempImageDto) {
    return this.agenteIaService.storeTempImage(payload);
  }

  @Get('temp-image/:imageId')
  async getTempImage(@Param('imageId') imageId: string, @Res() res: Response) {
    try {
      const imageData = this.agenteIaService.getTempImage(imageId);
      
      if (!imageData) {
        return res.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Image not found or expired'
        });
      }

      // Extraer el tipo de contenido del data URL
      const mimeType = imageData.imageData.split(':')[1]?.split(';')[0] || 'image/jpeg';
      
      // Enviar la imagen como respuesta
      const base64Data = imageData.imageData.split(',')[1];
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      res.set({
        'Content-Type': mimeType,
        'Content-Length': imageBuffer.length,
        'Cache-Control': 'public, max-age=1800' // 30 minutos
      });
      
      res.send(imageBuffer);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Error retrieving image'
      });
    }
  }

  @Get('sessions')
  listSessions() {
    return this.agenteIaService['sessionsRepo'].find({
      order: { updatedAt: 'DESC' },
      select: ['sessionId', 'title', 'createdAt', 'updatedAt'],
    });
  }
}
