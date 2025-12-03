import { Body, Controller, Get, Post, Put, Param, HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { ConfiguracionService } from './configuracion.service';
import { CreateConfiguracionDto } from './dto/create-configuracion.dto';

@Controller('configuracion')
export class ConfiguracionController {
  constructor(private readonly svc: ConfiguracionService) {}

  @Get()
  async get() {
    try {
      const result = await this.svc.findFirst();
      return result || null;
    } catch (error) {
      console.error('Error en GET /configuracion:', error);
      
      // Para cualquier error, devolver null en lugar de 500
      return null;
    }
  }

  @Post()
  async create(@Body() dto: CreateConfiguracionDto) {
    return this.svc.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() dto: Partial<CreateConfiguracionDto>) {
    return this.svc.update(Number(id), dto);
  }

  @Post('logo')
  async uploadLogo(@Body('imageBase64') imageBase64: string) {
    return this.svc.processLogoBase64(imageBase64);
  }
}
