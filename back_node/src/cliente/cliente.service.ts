import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClienteEntity } from './cliente.entity';
@Injectable()
export class ClienteService {
    constructor(
        @InjectRepository(ClienteEntity)
        private clienteRepo: Repository<ClienteEntity>,
    ){}
    findAll(): Promise<ClienteEntity[]>{
        return this.clienteRepo.find();
    }
    create(data: Partial<ClienteEntity>): Promise<ClienteEntity>{
        const cliente = this.clienteRepo.create(data);
        return this.clienteRepo.save(cliente);
    }
    async update(id:number, data: Partial<ClienteEntity>): Promise<ClienteEntity>{
        await this.clienteRepo.update(id,data);
        const cliente= await this.clienteRepo.findOneBy({ id });
        if (!cliente){
            throw new Error('cliente con id ${id} no encontrado');
        }
        return cliente;
    }
    async remove(id:number): Promise<{ deleted: boolean }> {
        await this.clienteRepo.delete(id);
        return {deleted:true};
    }
}
