import { Body, Controller, Get, Post, Put, Param } from '@nestjs/common';
import { ConfiguracionService } from './configuracion.service';
import { CreateConfiguracionDto } from './dto/create-configuracion.dto';

@Controller('configuracion')
export class ConfiguracionController {
  constructor(private readonly svc: ConfiguracionService) {}

  @Get()
  async get() {
    return this.svc.findFirst();
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
