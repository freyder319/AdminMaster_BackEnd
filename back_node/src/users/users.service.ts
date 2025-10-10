import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private readonly userRepository: Repository<Usuario>,
  ) {}

  async findByUsername(correo: string): Promise<Usuario | null> {
    return await this.userRepository.findOne({
      where: { correo },
    });
  }

  async findByCorreo(correo: string): Promise<Usuario | null> {
    return this.userRepository.findOne({ where: { correo } });
  }

  async findByTelefono(telefono: string): Promise<Usuario | null> {
    return this.userRepository.findOne({ where: { telefono } });
  }

  async findById(id: number): Promise<Usuario | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async actualizarContrasena(id: number, nueva: string) {
    const hash = await bcrypt.hash(nueva, 10);
    console.log('Hash generado en servicio:', hash);
    await this.userRepository.update(id, { contrasena: hash });
  }
}
