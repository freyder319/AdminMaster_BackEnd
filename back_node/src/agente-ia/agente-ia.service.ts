import { Injectable, BadGatewayException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SendMessageDto } from './dto/send-message.dto';
import { AnalyzeImageDto } from './dto/analyze-image.dto';
import { TempImageDto } from './dto/temp-image.dto';
import { AgenteIa } from './entities/agente-ia.entity';

@Injectable()
export class AgenteIaService {
  private readonly logger = new Logger(AgenteIaService.name);
  private readonly webhookUrl = process.env.N8N_CHAT_WEBHOOK ?? 'https://adminmaster.app.n8n.cloud/webhook/chat';
  private readonly imageAnalysisWebhook = process.env.N8N_IMAGE_WEBHOOK ?? 'https://adminmaster.app.n8n.cloud/webhook/image-analysis';
  
  // Almacenamiento temporal de imágenes (en producción usar Redis o base de datos)
  private readonly tempImages = new Map<string, { imageData: string; fileName: string; timestamp: number }>();

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(AgenteIa)
    private readonly sessionsRepo: Repository<AgenteIa>,
  ) {}

  async forwardToWebhook(payload: SendMessageDto): Promise<unknown> {
    try {
      // Guardar/actualizar sesión de chat si viene un sessionId
      if (payload.sessionId) {
        await this.persistSession(payload);
      }

      const { data } = await lastValueFrom(
        this.httpService.post(
          this.webhookUrl,
          {
            message: payload.message,
            history: payload.history ?? [],
            sessionId: payload.sessionId,
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

  async analyzeImage(payload: AnalyzeImageDto): Promise<unknown> {
    try {
      // Validar que la imagen no sea demasiado grande (max 5MB en base64)
      const imageSizeInBytes = (payload.imageBase64.length * 3) / 4;
      const imageSizeInMB = imageSizeInBytes / (1024 * 1024);
      
      if (imageSizeInMB > 5) {
        throw new BadGatewayException('La imagen es demasiado grande. Máximo permitido: 5MB');
      }

      const { data } = await lastValueFrom(
        this.httpService.post(
          this.imageAnalysisWebhook,
          {
            image: payload.imageBase64,
            fileName: payload.fileName || 'product-image.jpg',
            context: payload.context || 'Análisis de producto para formulario dinámico',
          },
          { timeout: 30000 }, // 30 segundos para análisis de imagen
        ),
      );

      return data;
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(
        `Error analizando imagen en n8n: ${axiosError.message}`,
        axiosError.stack,
      );
      
      if (axiosError.code === 'ECONNABORTED') {
        throw new BadGatewayException('El análisis de imagen tomó demasiado tiempo. Por favor, intenta con una imagen más pequeña.');
      }
      
      throw new BadGatewayException('No fue posible analizar la imagen. Por favor, intenta nuevamente.');
    }
  }

  async storeTempImage(payload: TempImageDto): Promise<{ imageUrl: string }> {
    try {
      const imageId = `${payload.sessionId}-${Date.now()}`;
      
      // Almacenar imagen temporal (expira en 30 minutos)
      this.tempImages.set(imageId, {
        imageData: payload.imageData,
        fileName: payload.fileName || 'product-image.jpg',
        timestamp: Date.now()
      });

      // Limpiar imágenes antiguas
      this.cleanupOldImages();

      const imageUrl = `${process.env.API_BASE_URL || 'http://localhost:3000'}/agente-ia/temp-image/${imageId}`;
      
      return { imageUrl };
    } catch (error) {
      this.logger.error('Error storing temporary image', error);
      throw new BadGatewayException('No fue posible almacenar la imagen temporalmente.');
    }
  }

  getTempImage(imageId: string): { imageData: string; fileName: string } | null {
    const image = this.tempImages.get(imageId);
    
    if (!image) {
      return null;
    }

    // Verificar si la imagen ha expirado (30 minutos)
    if (Date.now() - image.timestamp > 30 * 60 * 1000) {
      this.tempImages.delete(imageId);
      return null;
    }

    return {
      imageData: image.imageData,
      fileName: image.fileName
    };
  }

  private cleanupOldImages(): void {
    const now = Date.now();
    const expirationTime = 30 * 60 * 1000; // 30 minutos

    for (const [id, image] of this.tempImages.entries()) {
      if (now - image.timestamp > expirationTime) {
        this.tempImages.delete(id);
      }
    }
  }

  private async persistSession(payload: SendMessageDto): Promise<void> {
    const sessionId = payload.sessionId!;

    const existing = await this.sessionsRepo.findOne({ where: { sessionId } });

    const history = payload.history ?? [];

    // Título: primer mensaje de usuario en el historial o el mensaje actual
    const firstUserMessage = history.find((h) => h.role === 'user');
    const baseTitle = firstUserMessage?.text || payload.message || 'Chat';
    const title = baseTitle.length > 80 ? `${baseTitle.slice(0, 77)}...` : baseTitle;

    if (existing) {
      existing.title = title;
      existing.history = history;
      await this.sessionsRepo.save(existing);
      return;
    }

    const session = this.sessionsRepo.create({
      sessionId,
      title,
      history,
    });

    await this.sessionsRepo.save(session);
  }
}
