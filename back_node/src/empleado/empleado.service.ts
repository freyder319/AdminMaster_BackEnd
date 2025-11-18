import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empleado } from './empleado.entity';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto';
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
      nombre: (dto as any).nombre,
      apellido: (dto as any).apellido,
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

  async update(id: number, dto: UpdateEmpleadoDto): Promise<Empleado> {
    const empleado = await this.empleadoRepo.findOne({ where: { id }, relations: ['caja'] });
    if (!empleado) throw new NotFoundException('Empleado no encontrado');

    if ('contrasena' in dto) delete dto.contrasena;

    if ('cajaId' in dto) {
      if (dto.cajaId == null) {
        // desasignar caja (inhabilitar)
        (empleado as any).caja = null;
      } else {
        const nuevaCaja = await this.cajaRepo.findOne({ where: { id: dto.cajaId } });
        if (!nuevaCaja) throw new NotFoundException('Caja no encontrada');
        empleado.caja = nuevaCaja;
      }
    }

    if ((dto as any).nombre !== undefined) (empleado as any).nombre = (dto as any).nombre;
    if ((dto as any).apellido !== undefined) (empleado as any).apellido = (dto as any).apellido;
    if ((dto as any).correo !== undefined) (empleado as any).correo = (dto as any).correo;
    if ((dto as any).telefono !== undefined) (empleado as any).telefono = (dto as any).telefono;
    return this.empleadoRepo.save(empleado);
  }

  async findOne(id: number): Promise<Empleado> {
    const empleado = await this.empleadoRepo.findOne({ where: { id }, relations: ['caja'] });
    if (!empleado) throw new NotFoundException('Empleado no encontrado');
    return empleado;
  }

  async remove(id: number): Promise<{ deleted: boolean }> {
    try {
      const res = await this.empleadoRepo.delete(id);
      if (!res.affected) throw new NotFoundException('Empleado no encontrado');
      return { deleted: true };
    } catch (err: any) {
      const code = err?.code || err?.driverError?.code;
      const detail = err?.detail || err?.driverError?.detail;
      const isFk = code === '23503' || (typeof detail === 'string' && detail.toLowerCase().includes('llave foránea'));
      if (isFk) {
        throw new BadRequestException({
          code: '23503',
          message: 'No se puede eliminar el empleado porque tiene registros relacionados.'
        });
      }
      throw err;
    }
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
