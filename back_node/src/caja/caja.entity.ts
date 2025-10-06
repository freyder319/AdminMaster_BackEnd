import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Usuario } from '../users/user.entity';
@Entity('caja')
export class CajaEntity {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column({ type: 'varchar', length: 20, unique: true })
  codigoCaja!: string;
  @Column({ type: 'varchar', length: 50 })
  nombre!: string;
  @Column({ type: 'varchar', length: 20, nullable: false })
  estado!: string;
  @OneToMany(() => Usuario, (usuario) => usuario.caja)
  usuarios!: Usuario[];
  @CreateDateColumn()
  creadoEn!: Date;
  @UpdateDateColumn()
  actualizadoEn!: Date;
}
