import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Rol } from './role.enum';
import { CajaEntity } from '../caja/caja.entity';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  correo!: string;

  @Column()
  contrasena!: string;

  @Column({ type: 'enum', enum: Rol })
  rol!: Rol;

  @Column({ unique: true, nullable: false })
  telefono?: string;

  @ManyToOne(() => CajaEntity, (caja) => caja.usuarios, { nullable: true })
  caja?: CajaEntity;
}
