import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empleado } from './empleado.entity';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { CajaEntity } from 'src/caja/caja.entity';

@Injectable()
export class EmpleadoService {
  constructor(
    @InjectRepository(Empleado)
    private readonly empleadoRepo: Repository<Empleado>,

    @InjectRepository(CajaEntity)
    private readonly cajaRepo: Repository<CajaEntity>,
  ) {}

  async create(dto: CreateEmpleadoDto): Promise<Empleado> {
    const caja = await this.cajaRepo.findOne({ where: { id: dto.cajaId } });
    if (!caja) {
      throw new NotFoundException('Caja no encontrada');
    }

    const empleado = this.empleadoRepo.create({
      correo: dto.correo,
      contrasena: dto.contrasena,
      telefono: dto.telefono,
      caja: caja,
    });

    return this.empleadoRepo.save(empleado);
  }

  async findAllWithCaja(): Promise<Empleado[]> {
    return this.empleadoRepo.find({ relations: ['caja'] });
  }

  async findAll(): Promise<Empleado[]> {
    return this.empleadoRepo.find({ relations: ['caja'] });
  }

  async update(id: number, dto: Partial<CreateEmpleadoDto>): Promise<Empleado> {
    const empleado = await this.empleadoRepo.findOne({ where: { id }, relations: ['caja'] });
    if (!empleado) throw new NotFoundException('Empleado no encontrado');

    if ('contrasena' in dto) delete dto.contrasena;

    if ('cajaId' in dto && dto.cajaId !== undefined) {
      const nuevaCaja = await this.cajaRepo.findOne({ where: { id: dto.cajaId } });
      if (!nuevaCaja) throw new NotFoundException('Caja no encontrada');
      empleado.caja = nuevaCaja;
    }

    Object.assign(empleado, dto);
    return this.empleadoRepo.save(empleado);
  }

  async findOne(id: number): Promise<Empleado> {
    const empleado = await this.empleadoRepo.findOne({ where: { id }, relations: ['caja'] });
    if (!empleado) throw new NotFoundException('Empleado no encontrado');
    return empleado;
  }

  async remove(id: number): Promise<{ deleted: boolean }> {
    await this.empleadoRepo.delete(id);
    return { deleted: true };
  }

  async findByUsername(correo: string): Promise<Empleado | null> {
    return this.empleadoRepo.findOne({ where: { correo } });
  }

  async findByCorreo(correo: string): Promise<Empleado | null> {
    return this.empleadoRepo.findOne({
      where: { correo: correo.trim().toLowerCase() },
    });
  }

  async findById(id: number): Promise<Empleado | null> {
    return this.empleadoRepo.findOne({ where: { id } });
  }
}
