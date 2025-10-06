import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Rol } from './role.enum';
import { CajaEntity } from '../caja/caja.entity';
import { ManyToOne, JoinColumn } from 'typeorm';

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
  @Column({ unique: true })
  telefono!: string;
  @ManyToOne(() => CajaEntity, { nullable: true })
  @JoinColumn({ name: 'caja_id' })
  caja?: CajaEntity;
}
