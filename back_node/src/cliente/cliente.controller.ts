import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ClienteService } from './cliente.service';
import { ClienteEntity } from './cliente.entity';

@Controller('cliente')
export class ClienteController {
  constructor(private readonly clienteService: ClienteService) {}
    @Get()
    findAll(): Promise<ClienteEntity[]>{
        return this.clienteService.findAll();
    }
    @Get(':id')
    findOne(@Param('id') id: number): Promise<ClienteEntity> {
    return this.clienteService.findOne(id);
    }
    @Post()
    create(@Body() data: Partial<ClienteEntity>){
        return this.clienteService.create(data)
    }
    @Put(':id')
    update(@Param('id') id:number,@Body() data: Partial<ClienteEntity>){
        return this.clienteService.update(id, data);
    }
    @Delete(':id')
    remove(@Param('id') id:number){
        return this.clienteService.remove(id);
    }
}
