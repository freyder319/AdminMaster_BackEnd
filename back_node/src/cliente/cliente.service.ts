import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClienteEntity } from './cliente.entity';
@Injectable()
export class ClienteService {
  constructor(
    @InjectRepository(ClienteEntity)
    private clienteRepo: Repository<ClienteEntity>,
  ) {}
  findAll(): Promise<ClienteEntity[]> {
    return this.clienteRepo.find();
  }
  async findOne(id: number): Promise<ClienteEntity> {
    const cliente = await this.clienteRepo.findOneBy({ id });
    if (!cliente) {
      throw new NotFoundException(`Cliente con id ${id} no encontrado`);
    }
    return cliente;
  }
  async create(data: Partial<ClienteEntity>): Promise<ClienteEntity> {
    const clienteExistente = await this.clienteRepo.findOne({
      where: { correo: data.correo },
    });
    if (clienteExistente) {
      throw new BadRequestException('El Correo ya se Encuentra Registrado');
    }
    const cliente = this.clienteRepo.create(data);
    return this.clienteRepo.save(cliente);
  }
  async update(id: number, data: Partial<ClienteEntity>): Promise<ClienteEntity> {
    const cliente = await this.clienteRepo.findOneBy({ id });
    if (!cliente) {
      throw new Error(`cliente con id ${id} no encontrado`);
    }
    const clienteExistente = await this.clienteRepo.findOne({
      where: { correo: data.correo },
    });
    if (clienteExistente?.id !== cliente.id) {
      throw new BadRequestException('El Correo ya se Encuentra Registrado');
    }
    await this.clienteRepo.update(id, data);
    return cliente;
  }
  async remove(id: number): Promise<{ deleted: boolean }> {
    try {
      const res = await this.clienteRepo.delete(id);
      if (!res.affected) {
        throw new NotFoundException(`Cliente con id ${id} no encontrado`);
      }
      return { deleted: true };
    } catch (err: any) {
      const code = err?.code || err?.driverError?.code;
      const detail = err?.detail || err?.driverError?.detail;
      const isFk = code === '23503' || (typeof detail === 'string' && detail.toLowerCase().includes('llave foránea'));
      if (isFk) {
        throw new BadRequestException({
          code: '23503',
          message: 'No se puede eliminar el cliente porque tiene registros relacionados.'
        });
      }
      throw err;
    }
  }
}
