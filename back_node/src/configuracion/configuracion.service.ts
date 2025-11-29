import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfiguracionNegocio } from './configuracion.entity';
import { CreateConfiguracionDto } from './dto/create-configuracion.dto';
import axios from 'axios';
import { join } from 'path';
import { promises as fs } from 'fs';

@Injectable()
export class ConfiguracionService {
  constructor(
    @InjectRepository(ConfiguracionNegocio)
    private repo: Repository<ConfiguracionNegocio>,
  ) {}

  async findFirst(): Promise<ConfiguracionNegocio | null> {
    return this.repo.findOne({ where: {} });
  }

  async create(dto: CreateConfiguracionDto): Promise<ConfiguracionNegocio> {
    const exists = await this.findFirst();
    if (exists) throw new BadRequestException('La configuración ya existe');
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async update(id: number, dto: Partial<ConfiguracionNegocio>): Promise<ConfiguracionNegocio> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Configuración no encontrada');
    Object.assign(entity, dto);
    return this.repo.save(entity);
  }

  /**
   * Procesa un logo enviado como imagen base64: quita el fondo usando un servicio externo,
   * guarda el PNG resultante en storage y actualiza logoUrl en la configuración.
   */
  async processLogoBase64(imageBase64: string): Promise<ConfiguracionNegocio> {
    if (!imageBase64) {
      throw new BadRequestException('imageBase64 es requerido');
    }

    // Quitar prefijo data URL si viene incluido
    const base64Clean = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

    const apiKey = process.env.REMOVEBG_API_KEY;
    if (!apiKey) {
      throw new BadRequestException('Falta configurar REMOVEBG_API_KEY en el backend');
    }

    // Llamar a la API de remove.bg (u otro servicio similar)
    const response = await axios({
      method: 'post',
      url: 'https://api.remove.bg/v1.0/removebg',
      data: {
        image_file_b64: base64Clean,
        size: 'auto',
      },
      headers: {
        'X-Api-Key': apiKey,
      },
      responseType: 'arraybuffer',
      validateStatus: () => true,
    });

    if (response.status !== 200) {
      throw new BadRequestException('No se pudo procesar el logo en el servicio de eliminación de fondo');
    }

    // Guardar archivo PNG sin fondo en storage/logo.png
    const storageDir = join(__dirname, '..', '..', 'storage');
    await fs.mkdir(storageDir, { recursive: true });
    const filePath = join(storageDir, 'logo.png');
    await fs.writeFile(filePath, response.data);

    // Construir URL pública (usa storage que ya está servido en main.ts)
    const baseUrl = process.env.PUBLIC_BASE_URL ?? 'https://antojitosdoima.site/api';
    const logoUrl = `${baseUrl}/storage/logo.png`;

    // Actualizar o crear configuración con el nuevo logo
    let cfg = await this.findFirst();
    if (cfg) {
      cfg.logoUrl = logoUrl;
      cfg = await this.repo.save(cfg);
    } else {
      const dto: CreateConfiguracionDto = {
        nombreNegocio: '',
        direccion: '',
        ciudad: '',
        celular: '',
        correo: '',
        documento: '',
        logoUrl,
      };
      cfg = await this.create(dto);
    }

    return cfg;
  }
}
