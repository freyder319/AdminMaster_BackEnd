import { Body, Controller, Post, Get } from '@nestjs/common';
import { PqrsService } from './pqrs.service';
import type { CreatePqrsDto } from './pqrs.service';

@Controller('pqrs')
export class PqrsController {
  constructor(private readonly pqrsService: PqrsService) {}

  @Post()
  create(@Body() body: CreatePqrsDto) {
    return this.pqrsService.create(body);
  }

  @Get()
  findAll() {
    return this.pqrsService.findAll();
  }
}
